// @ts-nocheck
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Unlock,
  Lock,
  History,
  ArrowLeft,
} from "lucide-react";

export default function ComplianceManagement() {
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockType, setBlockType] = useState<"temporary" | "permanent">(
    "temporary"
  );
  const [daysBlocked, setDaysBlocked] = useState(3);
  const [unblockReason, setUnblockReason] = useState("");

  const {
    data: blockedWorkers,
    isLoading,
    refetch,
  } = trpc.compliance.listBlocked.useQuery();
  const { data: metrics } = trpc.compliance.getMetrics.useQuery();
  const { data: history } = trpc.compliance.getHistory.useQuery(
    { workerId: selectedWorker?.id || 0 },
    { enabled: !!selectedWorker && showHistoryDialog }
  );

  const blockMutation = trpc.compliance.blockWorker.useMutation({
    onSuccess: () => {
      toast.success("Trabalhador bloqueado com sucesso");
      setShowBlockDialog(false);
      setBlockReason("");
      refetch();
    },
    onError: error => {
      toast.error(`Erro ao bloquear: ${error.message}`);
    },
  });

  const unblockMutation = trpc.compliance.unblockWorker.useMutation({
    onSuccess: () => {
      toast.success("Trabalhador desbloqueado com sucesso");
      setShowUnblockDialog(false);
      setUnblockReason("");
      refetch();
    },
    onError: error => {
      toast.error(`Erro ao desbloquear: ${error.message}`);
    },
  });

  const handleBlock = () => {
    if (!blockReason.trim()) {
      toast.error("Motivo obrigatório");
      return;
    }

    blockMutation.mutate({
      workerId: selectedWorker.id,
      reason: blockReason,
      blockType,
      daysBlocked: blockType === "temporary" ? daysBlocked : undefined,
    });
  };

  const handleUnblock = () => {
    if (!unblockReason.trim()) {
      toast.error("Justificativa obrigatória");
      return;
    }

    unblockMutation.mutate({
      workerId: selectedWorker.id,
      reason: unblockReason,
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Controle de Conformidade
          </h1>
          <p className="text-muted-foreground">
            Gestão de bloqueios e conformidade trabalhista
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Trabalhadores
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalWorkers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloqueados</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {metrics?.blockedWorkers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bloqueios Temporários
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {metrics?.temporaryBlocks || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Conformidade
            </CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {metrics?.complianceRate || "100"}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Trabalhadores Bloqueados */}
      <Card>
        <CardHeader>
          <CardTitle>Trabalhadores Bloqueados</CardTitle>
          <CardDescription>
            {blockedWorkers?.length || 0} trabalhador(es) bloqueado(s)
            atualmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!blockedWorkers || blockedWorkers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum trabalhador bloqueado no momento
            </p>
          ) : (
            <div className="space-y-4">
              {blockedWorkers.map((worker: any) => (
                <Card key={worker.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{worker.fullName}</h3>
                          <Badge
                            variant={
                              worker.blockType === "permanent"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {worker.blockType === "permanent"
                              ? "Permanente"
                              : "Temporário"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          CPF: {worker.cpf}
                        </p>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">
                            Motivo do Bloqueio:
                          </p>
                          <p className="text-sm">{worker.blockReason}</p>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>
                            Bloqueado em:{" "}
                            {new Date(worker.blockedAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                          {worker.blockExpiresAt && (
                            <span>
                              Expira em:{" "}
                              {new Date(
                                worker.blockExpiresAt
                              ).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedWorker(worker);
                            setShowHistoryDialog(true);
                          }}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Histórico
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedWorker(worker);
                            setShowUnblockDialog(true);
                          }}
                        >
                          <Unlock className="h-4 w-4 mr-2" />
                          Desbloquear
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Desbloqueio */}
      <Dialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desbloquear Trabalhador</DialogTitle>
            <DialogDescription>
              Forneça uma justificativa para desbloquear{" "}
              {selectedWorker?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="unblockReason">Justificativa *</Label>
              <Textarea
                id="unblockReason"
                value={unblockReason}
                onChange={e => setUnblockReason(e.target.value)}
                placeholder="Ex: Trabalhador cumpriu período de suspensão e foi reorientado..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnblockDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUnblock}
              disabled={unblockMutation.isPending}
            >
              {unblockMutation.isPending ? "Desbloqueando..." : "Desbloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Bloqueios</DialogTitle>
            <DialogDescription>
              Histórico completo de bloqueios e desbloqueios de{" "}
              {selectedWorker?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {!history || history.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum histórico encontrado
              </p>
            ) : (
              history.map((entry: any) => (
                <Card key={entry.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {entry.action === "blocked" ? (
                        <Lock className="h-5 w-5 text-destructive mt-0.5" />
                      ) : (
                        <Unlock className="h-5 w-5 text-green-500 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              entry.action === "blocked"
                                ? "destructive"
                                : "default"
                            }
                          >
                            {entry.action === "blocked"
                              ? "Bloqueado"
                              : "Desbloqueado"}
                          </Badge>
                          {entry.blockType && (
                            <Badge variant="outline">
                              {entry.blockType === "permanent"
                                ? "Permanente"
                                : "Temporário"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{entry.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
