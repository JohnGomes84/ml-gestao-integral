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
import { AlertTriangle, Calendar, CheckCircle, Plus, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Allocations() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    workerId: "",
    clientId: "",
    locationId: "",
    workDate: new Date().toISOString().split('T')[0],
    jobFunction: "",
    dailyRate: "",
  });

  const { data: workers } = trpc.workers.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: locations } = trpc.locations.list.useQuery({
    clientId: formData.clientId ? parseInt(formData.clientId) : undefined,
  });

  const { data: suggestedWorkers, refetch: refetchSuggestions } =
    trpc.allocations.suggestWorkers.useQuery(
      {
        clientId: parseInt(formData.clientId),
        locationId: parseInt(formData.locationId),
        workDate: formData.workDate,
      },
      {
        enabled: !!formData.clientId && !!formData.locationId && !!formData.workDate,
      }
    );

  const { data: allocations, isLoading, refetch } = trpc.allocations.list.useQuery({});

  const createAllocation = trpc.allocations.create.useMutation({
    onSuccess: () => {
      toast.success("Alocação criada com sucesso!");
      setIsDialogOpen(false);
      setFormData({
        workerId: "",
        clientId: "",
        locationId: "",
        workDate: new Date().toISOString().split('T')[0],
        jobFunction: "",
        dailyRate: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAllocation.mutate({
      workerId: parseInt(formData.workerId),
      clientId: parseInt(formData.clientId),
      locationId: parseInt(formData.locationId),
      workDate: formData.workDate,
      jobFunction: formData.jobFunction,
      dailyRate: parseFloat(formData.dailyRate),
    });
  };

  const getRiskBadge = (riskFlag?: boolean) => {
    if (riskFlag) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertTriangle className="h-3 w-3" />
          Alto Risco
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle className="h-3 w-3" />
        Normal
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { label: "Agendado", color: "bg-blue-100 text-blue-700" },
      confirmed: { label: "Confirmado", color: "bg-green-100 text-green-700" },
      in_progress: { label: "Em Andamento", color: "bg-yellow-100 text-yellow-700" },
      completed: { label: "Concluído", color: "bg-gray-100 text-gray-700" },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.scheduled;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
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
              <p className="text-sm text-slate-600">Gerenciar Alocações</p>
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
            <h1 className="text-2xl font-bold text-slate-900">📅 Alocações</h1>
            <p className="text-slate-600">
              {allocations?.length || 0} alocação(ões) cadastrada(s)
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Nova Alocação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Criar Nova Alocação</DialogTitle>
                  <DialogDescription>
                    O sistema sugerirá trabalhadores com menor risco de vínculo empregatício.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {/* Cliente */}
                  <div className="grid gap-2">
                    <Label htmlFor="clientId">Cliente *</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, clientId: value, locationId: "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Local */}
                  <div className="grid gap-2">
                    <Label htmlFor="locationId">Local *</Label>
                    <Select
                      value={formData.locationId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, locationId: value });
                        refetchSuggestions();
                      }}
                      disabled={!formData.clientId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um local" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations?.map((location) => (
                          <SelectItem key={location.id} value={location.id.toString()}>
                            {location.locationName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data */}
                  <div className="grid gap-2">
                    <Label htmlFor="workDate">Data do Trabalho *</Label>
                    <Input
                      id="workDate"
                      type="date"
                      value={formData.workDate}
                      onChange={(e) => {
                        setFormData({ ...formData, workDate: e.target.value });
                        refetchSuggestions();
                      }}
                      required
                    />
                  </div>

                  {/* Sugestões de Trabalhadores */}
                  {suggestedWorkers && suggestedWorkers.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-sm font-medium text-green-900 mb-2">
                        ✅ Trabalhadores Sugeridos (Baixo Risco)
                      </h4>
                      <div className="space-y-2">
                        {suggestedWorkers.slice(0, 3).map((worker) => (
                          <button
                            key={worker.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                workerId: worker.id.toString(),
                                dailyRate: worker.dailyRate || "",
                              });
                            }}
                            className={`w-full text-left p-2 rounded border transition-colors ${
                              formData.workerId === worker.id.toString()
                                ? "border-green-500 bg-green-100"
                                : "border-green-200 bg-white hover:border-green-300"
                            }`}
                          >
                            <p className="font-medium text-sm">{worker.fullName}</p>
                            <p className="text-xs text-slate-600">
                              Score de risco: {worker.riskScore} (Baixo)
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trabalhador (Manual) */}
                  <div className="grid gap-2">
                    <Label htmlFor="workerId">Trabalhador *</Label>
                    <Select
                      value={formData.workerId}
                      onValueChange={(value) => {
                        const worker = workers?.find((w) => w.id.toString() === value);
                        setFormData({
                          ...formData,
                          workerId: value,
                          dailyRate: worker?.dailyRate || "",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um trabalhador" />
                      </SelectTrigger>
                      <SelectContent>
                        {workers?.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id.toString()}>
                            {worker.fullName} - {worker.riskLevel || "Novo"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Função */}
                  <div className="grid gap-2">
                    <Label htmlFor="jobFunction">Função *</Label>
                    <Select
                      value={formData.jobFunction}
                      onValueChange={(value) => setFormData({ ...formData, jobFunction: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ajudante">Ajudante</SelectItem>
                        <SelectItem value="Conferente">Conferente</SelectItem>
                        <SelectItem value="Motorista 1">Motorista 1</SelectItem>
                        <SelectItem value="Motorista 2">Motorista 2</SelectItem>
                        <SelectItem value="Motorista 3">Motorista 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Valor da Diária */}
                  <div className="grid gap-2">
                    <Label htmlFor="dailyRate">Valor da Diária (R$) *</Label>
                    <Input
                      id="dailyRate"
                      type="number"
                      step="0.01"
                      placeholder="150.00"
                      value={formData.dailyRate}
                      onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                      required
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
                  <Button type="submit" disabled={createAllocation.isPending}>
                    {createAllocation.isPending ? "Criando..." : "Criar Alocação"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Allocations List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando alocações...</p>
          </div>
        ) : allocations && allocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allocations.map((allocation) => (
              <Card key={allocation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {new Date(allocation.workDate).toLocaleDateString('pt-BR')}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {allocation.jobFunction || "Função não especificada"}
                      </CardDescription>
                    </div>
                    {getRiskBadge(allocation.riskFlag || undefined)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-600">Trabalhador:</span>{" "}
                      <span className="font-medium">ID {allocation.workerId}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Cliente:</span>{" "}
                      <span className="font-medium">ID {allocation.clientId}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Local:</span>{" "}
                      <span className="font-medium">ID {allocation.locationId}</span>
                    </div>
                    {allocation.dailyRate && (
                      <div>
                        <span className="text-slate-600">Diária:</span>{" "}
                        <span className="font-medium">
                          R$ {parseFloat(allocation.dailyRate).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="pt-2">
                      {getStatusBadge(allocation.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Nenhuma alocação cadastrada
              </h3>
              <p className="text-slate-600 mb-4">
                Comece criando sua primeira alocação
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Alocação
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
