import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Plus, Trash2, Users } from "lucide-react";

export default function CreateOperation() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    clientId: "",
    locationId: "",
    contractId: "",
    shiftId: "",
    leaderId: "",
    operationName: "",
    workDate: "",
    description: "",
  });

  const [members, setMembers] = useState<Array<{
    workerId: string;
    jobFunction: string;
    dailyRate: string;
  }>>([]);

  const [workerContinuityStatus, setWorkerContinuityStatus] = useState<Record<number, {
    consecutiveDays: number;
    isAtRisk: boolean;
    isCritical: boolean;
    message: string;
  }>>({});

  const { data: clients } = trpc.clients.list.useQuery();
  const { data: allWorkers } = trpc.workers.list.useQuery();
  
  // Buscar status de continuidade quando cliente for selecionado
  const clientIdNum = formData.clientId ? parseInt(formData.clientId) : null;
  
  useEffect(() => {
    if (!clientIdNum || !allWorkers) {
      setWorkerContinuityStatus({});
      return;
    }
    
    // Buscar status para cada trabalhador
    const statuses: Record<number, any> = {};
    let completed = 0;
    
    allWorkers.forEach((worker) => {
      // Fazer chamada individual para cada trabalhador
      fetch(`/api/trpc/compliance.getConsecutiveDays?input=${encodeURIComponent(JSON.stringify({ workerId: worker.id, clientId: clientIdNum }))}`)
        .then(res => res.json())
        .then(data => {
          if (data.result?.data) {
            statuses[worker.id] = data.result.data;
          }
          completed++;
          if (completed === allWorkers.length) {
            setWorkerContinuityStatus(statuses);
          }
        })
        .catch(err => console.error(`Erro ao buscar status de ${worker.fullName}:`, err));
    });
  }, [clientIdNum, allWorkers]);
  // Filtrar trabalhadores bloqueados
  const workers = allWorkers?.filter(w => !w.isBlocked) || [];
  // Buscar líderes através de uma query específica ou filtrar localmente
  // Por enquanto, vamos criar um campo manual para o líder
  const { data: shifts } = trpc.shifts.list.useQuery();
  const { data: contracts } = trpc.contracts.list.useQuery();

  // Filtrar locais por cliente selecionado
  const selectedClientId = formData.clientId ? parseInt(formData.clientId) : null;
  const locations = selectedClientId
    ? clients?.find(c => c.id === selectedClientId)?.locations || []
    : [];

  // Filtrar turnos por cliente selecionado
  const availableShifts = selectedClientId
    ? shifts?.filter(s => s.clientId === selectedClientId) || []
    : [];

  // Filtrar contratos por cliente selecionado
  const availableContracts = selectedClientId
    ? contracts?.filter(c => c.clientId === selectedClientId) || []
    : [];

  // Lista de líderes (temporário - idealmente viria de uma API)
  const leaders: Array<{ id: number; name: string; email: string }> = [];

  const createOperation = trpc.operations.create.useMutation({
    onSuccess: () => {
      toast.success("Operação criada com sucesso!");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const addMember = () => {
    setMembers([...members, { workerId: "", jobFunction: "", dailyRate: "" }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: string, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (members.length === 0) {
      toast.error("Adicione pelo menos um trabalhador à operação");
      return;
    }

    const invalidMembers = members.filter(
      m => !m.workerId || !m.jobFunction || !m.dailyRate
    );

    if (invalidMembers.length > 0) {
      toast.error("Preencha todos os campos dos trabalhadores");
      return;
    }

    createOperation.mutate({
      clientId: parseInt(formData.clientId),
      locationId: parseInt(formData.locationId),
      contractId: formData.contractId ? parseInt(formData.contractId) : null,
      shiftId: parseInt(formData.shiftId),
      leaderId: parseInt(formData.leaderId),
      operationName: formData.operationName,
      workDate: formData.workDate,
      description: formData.description || undefined,
      members: members.map(m => ({
        workerId: parseInt(m.workerId),
        jobFunction: m.jobFunction,
        dailyRate: parseFloat(m.dailyRate),
      })),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Criar Nova Operação</h1>
          <p className="text-slate-600 mt-2">
            Configure uma operação com equipe e líder
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Operação</CardTitle>
              <CardDescription>Dados gerais da operação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operationName">Nome da Operação *</Label>
                  <Input
                    id="operationName"
                    value={formData.operationName}
                    onChange={(e) => setFormData({ ...formData, operationName: e.target.value })}
                    placeholder="Ex: Operação Centro - Manhã"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workDate">Data *</Label>
                  <Input
                    id="workDate"
                    type="date"
                    value={formData.workDate}
                    onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientId">Cliente *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      clientId: value,
                      locationId: "",
                      shiftId: "",
                      contractId: "",
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
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

                <div className="space-y-2">
                  <Label htmlFor="locationId">Local *</Label>
                  <Select
                    value={formData.locationId}
                    onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                    disabled={!formData.clientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o local" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location: any) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.locationName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shiftId">Turno *</Label>
                  <Select
                    value={formData.shiftId}
                    onValueChange={(value) => setFormData({ ...formData, shiftId: value })}
                    disabled={!formData.clientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableShifts.map((shift: any) => (
                        <SelectItem key={shift.id} value={shift.id.toString()}>
                          {shift.shiftName} ({shift.startTime} - {shift.endTime})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractId">Contrato (Opcional)</Label>
                  <Select
                    value={formData.contractId}
                    onValueChange={(value) => setFormData({ ...formData, contractId: value })}
                    disabled={!formData.clientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {availableContracts.map((contract: any) => (
                        <SelectItem key={contract.id} value={contract.id.toString()}>
                          {contract.contractName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leaderId">Líder de Equipe *</Label>
                  <Select
                    value={formData.leaderId}
                    onValueChange={(value) => setFormData({ ...formData, leaderId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o líder" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaders.map((leader: any) => (
                        <SelectItem key={leader.id} value={leader.id.toString()}>
                          {leader.name || leader.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes adicionais sobre a operação..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Equipe */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Equipe
                  </CardTitle>
                  <CardDescription>Adicione os trabalhadores da operação</CardDescription>
                </div>
                <Button type="button" onClick={addMember} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Trabalhador
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {members.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Nenhum trabalhador adicionado. Clique em "Adicionar Trabalhador" para começar.
                </div>
              ) : (
                members.map((member, index) => (
                  <div key={index} className="flex gap-4 items-end p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Label>Trabalhador *</Label>
                      <Select
                        value={member.workerId}
                        onValueChange={(value) => updateMember(index, "workerId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {workers?.map((worker) => {
                            const status = workerContinuityStatus[worker.id];
                            return (
                              <SelectItem key={worker.id} value={worker.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <span>{worker.fullName} - {worker.cpf}</span>
                                  {status && status.isCritical && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">
                                      BLOQUEADO
                                    </span>
                                  )}
                                  {status && status.isAtRisk && !status.isCritical && (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-semibold">
                                      ALERTA: {status.consecutiveDays} dias
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label>Função *</Label>
                      <Input
                        value={member.jobFunction}
                        onChange={(e) => updateMember(index, "jobFunction", e.target.value)}
                        placeholder="Ex: Ajudante, Motorista"
                      />
                    </div>

                    <div className="w-32 space-y-2">
                      <Label>Diária (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={member.dailyRate}
                        onChange={(e) => updateMember(index, "dailyRate", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeMember(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={createOperation.isPending}>
              {createOperation.isPending ? "Criando..." : "Criar Operação"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/">Cancelar</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
