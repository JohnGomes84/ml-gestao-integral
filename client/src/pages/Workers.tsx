import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle, Plus, UserPlus, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Workers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    cpf: "",
    phone: "",
    pixKey: "",
    workerType: "daily" as "daily" | "clt" | "freelancer" | "mei",
    dailyRate: "",
  });

  const { data: workers, isLoading, refetch } = trpc.workers.list.useQuery();
  const createWorker = trpc.workers.create.useMutation({
    onSuccess: () => {
      toast.success("Trabalhador cadastrado com sucesso!");
      setIsDialogOpen(false);
      setFormData({
        fullName: "",
        cpf: "",
        phone: "",
        pixKey: "",
        workerType: "daily",
        dailyRate: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorker.mutate({
      fullName: formData.fullName,
      cpf: formData.cpf,
      phone: formData.phone,
      pixKey: formData.pixKey || undefined,
      workerType: formData.workerType,
      dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
    });
  };

  const getRiskBadge = (riskLevel?: string, riskScore?: number) => {
    switch (riskLevel) {
      case "low":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" />
            Baixo ({riskScore || 0})
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <AlertTriangle className="h-3 w-3" />
            Médio ({riskScore || 0})
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="h-3 w-3" />
            Alto ({riskScore || 0})
          </span>
        );
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-200 text-red-900">
            <XCircle className="h-3 w-3" />
            Crítico ({riskScore || 0})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Novo
          </span>
        );
    }
  };

  const getWorkerTypeLabel = (type: string) => {
    switch (type) {
      case "daily":
        return "Diarista";
      case "clt":
        return "CLT";
      case "freelancer":
        return "Freelancer";
      case "mei":
        return "MEI";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/">
                <span className="text-2xl font-bold text-slate-900 hover:text-slate-700 cursor-pointer">
                  ML Serviços
                </span>
              </Link>
              <p className="text-sm text-slate-600">Gerenciar Trabalhadores</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">← Voltar ao Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">👥 Trabalhadores</h1>
            <p className="text-slate-600">
              {workers?.length || 0} trabalhador(es) cadastrado(s)
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Trabalhador
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Trabalhador</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do trabalhador. Campos com * são obrigatórios.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="pixKey">Chave PIX</Label>
                    <Input
                      id="pixKey"
                      placeholder="CPF, e-mail ou telefone"
                      value={formData.pixKey}
                      onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="workerType">Tipo de Contrato *</Label>
                    <Select
                      value={formData.workerType}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, workerType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diarista</SelectItem>
                        <SelectItem value="freelancer">Freelancer</SelectItem>
                        <SelectItem value="mei">MEI</SelectItem>
                        <SelectItem value="clt">CLT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dailyRate">Valor da Diária (R$)</Label>
                    <Input
                      id="dailyRate"
                      type="number"
                      step="0.01"
                      placeholder="150.00"
                      value={formData.dailyRate}
                      onChange={(e) =>
                        setFormData({ ...formData, dailyRate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createWorker.isPending}>
                    {createWorker.isPending ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Workers List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando trabalhadores...</p>
          </div>
        ) : workers && workers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker) => (
              <Card key={worker.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{worker.fullName}</CardTitle>
                      <CardDescription className="mt-1">
                        {getWorkerTypeLabel(worker.workerType)}
                      </CardDescription>
                    </div>
                    {getRiskBadge(worker.riskLevel || undefined, worker.riskScore || undefined)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-600">CPF:</span>{" "}
                      <span className="font-medium">{worker.cpf}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Telefone:</span>{" "}
                      <span className="font-medium">{worker.phone}</span>
                    </div>
                    {worker.dailyRate && (
                      <div>
                        <span className="text-slate-600">Diária:</span>{" "}
                        <span className="font-medium">
                          R$ {parseFloat(worker.dailyRate).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-600">Status:</span>{" "}
                      <span
                        className={`font-medium ${
                          worker.status === "active"
                            ? "text-green-600"
                            : worker.status === "inactive"
                            ? "text-gray-600"
                            : "text-red-600"
                        }`}
                      >
                        {worker.status === "active"
                          ? "Ativo"
                          : worker.status === "inactive"
                          ? "Inativo"
                          : "Bloqueado"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/trabalhadores/${worker.id}`}>Ver Detalhes</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <UserPlus className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Nenhum trabalhador cadastrado
              </h3>
              <p className="text-slate-600 mb-4">
                Comece cadastrando seu primeiro trabalhador
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Trabalhador
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
