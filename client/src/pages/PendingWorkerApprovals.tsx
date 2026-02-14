import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, Eye, User, MapPin, Phone, Mail, CreditCard, FileText, Calendar } from "lucide-react";

export default function PendingWorkerApprovals() {
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingWorkers, isLoading, refetch } = trpc.workerRegistration.listPending.useQuery();

  const approveMutation = trpc.workerRegistration.approve.useMutation({
    onSuccess: () => {
      toast.success("Cadastro aprovado com sucesso!");
      setShowApproveDialog(false);
      setSelectedWorker(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  const rejectMutation = trpc.workerRegistration.reject.useMutation({
    onSuccess: () => {
      toast.success("Cadastro rejeitado");
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedWorker(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar: ${error.message}`);
    },
  });

  const handleApprove = () => {
    if (!selectedWorker) return;
    approveMutation.mutate({ workerId: selectedWorker.id });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Motivo da rejeição é obrigatório");
      return;
    }
    if (!selectedWorker) return;
    rejectMutation.mutate({
      workerId: selectedWorker.id,
      reason: rejectionReason,
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
            <User className="h-8 w-8" />
            Cadastros Pendentes de Aprovação
          </h1>
          <p className="text-muted-foreground">
            Revise e aprove cadastros de novos trabalhadores
          </p>
        </div>
      </div>

      {/* Contador */}
      <Card className="mb-6 bg-orange-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Cadastros Aguardando Aprovação</p>
              <p className="text-3xl font-bold text-orange-900">{pendingWorkers?.length || 0}</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-orange-200 flex items-center justify-center">
              <User className="h-8 w-8 text-orange-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cadastros Pendentes */}
      {!pendingWorkers || pendingWorkers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum cadastro pendente</h3>
            <p className="text-muted-foreground">
              Todos os cadastros foram processados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingWorkers.map((worker: any) => (
            <Card key={worker.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {worker.fullName}
                      <Badge variant="secondary">Pendente</Badge>
                    </CardTitle>
                    <CardDescription>
                      Cadastrado em {new Date(worker.createdAt).toLocaleString("pt-BR")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedWorker(worker);
                        setShowDocumentDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Documento
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedWorker(worker);
                        setShowRejectDialog(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedWorker(worker);
                        setShowApproveDialog(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Dados Pessoais */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Dados Pessoais
                    </h4>
                    <div className="text-sm space-y-1">
                      <p><strong>CPF:</strong> {worker.cpf}</p>
                      <p><strong>Data de Nascimento:</strong> {new Date(worker.dateOfBirth).toLocaleDateString("pt-BR")}</p>
                      <p><strong>Nome da Mãe:</strong> {worker.motherName}</p>
                      <p><strong>Tipo de Contrato:</strong> {worker.contractType}</p>
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contato
                    </h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Telefone:</strong> {worker.phone}</p>
                      <p><strong>Email:</strong> {worker.email || "Não informado"}</p>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>{worker.street}, {worker.number}</p>
                      {worker.complement && <p>{worker.complement}</p>}
                      <p>{worker.neighborhood}</p>
                      <p>{worker.city} - {worker.state}</p>
                      <p>CEP: {worker.zipCode}</p>
                    </div>
                  </div>

                  {/* Pagamento */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Dados de Pagamento
                    </h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Tipo de Chave PIX:</strong> {worker.pixKeyType}</p>
                      <p><strong>Chave PIX:</strong> {worker.pixKey}</p>
                    </div>
                  </div>

                  {/* Documento */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documento
                    </h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Tipo:</strong> {worker.documentType}</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => {
                          setSelectedWorker(worker);
                          setShowDocumentDialog(true);
                        }}
                      >
                        Ver documento anexado →
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Aprovação */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Cadastro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja aprovar o cadastro de {selectedWorker?.fullName}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Após a aprovação, o trabalhador poderá ser alocado em operações.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? "Aprovando..." : "Aprovar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Cadastro</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do cadastro de {selectedWorker?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Motivo da Rejeição *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Documento ilegível, dados inconsistentes, menor de idade..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejeitando..." : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização de Documento */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Documento com Foto - {selectedWorker?.fullName}</DialogTitle>
            <DialogDescription>
              {selectedWorker?.documentType} enviado para validação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWorker?.documentPhotoUrl ? (
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={selectedWorker.documentPhotoUrl}
                  alt="Documento"
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum documento anexado
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
