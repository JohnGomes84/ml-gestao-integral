import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { FileText, Plus, DollarSign } from "lucide-react";

export default function Contracts() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  
  const { data: contracts, isLoading } = trpc.contracts.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const createContract = trpc.contracts.create.useMutation({
    onSuccess: () => {
      toast.success("Contrato criado com sucesso!");
      setOpen(false);
      utils.contracts.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    clientId: "",
    contractName: "",
    contractNumber: "",
    startDate: "",
    endDate: "",
    dailyRates: JSON.stringify({
      ajudante: 150,
      conferente: 180,
      motorista1: 200,
      motorista2: 220,
      motorista3: 250,
    }, null, 2),
    providesUniform: true,
    providesEpi: true,
    providesMeal: true,
    mealCost: 25,
    mealTicketValue: 30,
    billingCycle: "biweekly" as "weekly" | "biweekly" | "monthly",
    chargePerPerson: 200,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar JSON
    try {
      JSON.parse(formData.dailyRates);
    } catch {
      toast.error("Valores por função devem ser um JSON válido");
      return;
    }
    
    createContract.mutate({
      ...formData,
      clientId: parseInt(formData.clientId),
      chargePerPerson: parseFloat(formData.chargePerPerson.toString()),
      mealCost: parseFloat(formData.mealCost.toString()),
      mealTicketValue: parseFloat(formData.mealTicketValue.toString()),
    });
  };

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">Parametrização de contratos por cliente</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Contrato</DialogTitle>
              <DialogDescription>
                Configure os valores e benefícios para este cliente
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  required
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractName">Nome do Contrato *</Label>
                  <Input
                    id="contractName"
                    value={formData.contractName}
                    onChange={(e) => setFormData({ ...formData, contractName: e.target.value })}
                    placeholder="Ex: Contrato 2026"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractNumber">Número do Contrato</Label>
                  <Input
                    id="contractNumber"
                    value={formData.contractNumber}
                    onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                    placeholder="Ex: CT-2026-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Data de Término</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyRates">Valores por Função (JSON) *</Label>
                <Textarea
                  id="dailyRates"
                  value={formData.dailyRates}
                  onChange={(e) => setFormData({ ...formData, dailyRates: e.target.value })}
                  rows={6}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Formato: {`{"ajudante": 150, "conferente": 180, ...}`}
                </p>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold">Benefícios</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="providesUniform">Fornece Uniforme</Label>
                  <Switch
                    id="providesUniform"
                    checked={formData.providesUniform}
                    onCheckedChange={(checked) => setFormData({ ...formData, providesUniform: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="providesEpi">Fornece EPI</Label>
                  <Switch
                    id="providesEpi"
                    checked={formData.providesEpi}
                    onCheckedChange={(checked) => setFormData({ ...formData, providesEpi: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="providesMeal">Fornece Marmita</Label>
                  <Switch
                    id="providesMeal"
                    checked={formData.providesMeal}
                    onCheckedChange={(checked) => setFormData({ ...formData, providesMeal: checked })}
                  />
                </div>

                {formData.providesMeal && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="mealCost">Custo da Marmita (R$)</Label>
                      <Input
                        id="mealCost"
                        type="number"
                        step="0.01"
                        value={formData.mealCost}
                        onChange={(e) => setFormData({ ...formData, mealCost: parseFloat(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">Descontado do trabalhador</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mealTicketValue">Ticket Alimentação (R$)</Label>
                      <Input
                        id="mealTicketValue"
                        type="number"
                        step="0.01"
                        value={formData.mealTicketValue}
                        onChange={(e) => setFormData({ ...formData, mealTicketValue: parseFloat(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">Convenção Coletiva</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold">Faturamento</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="billingCycle">Ciclo de Faturamento</Label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(value: "weekly" | "biweekly" | "monthly") => 
                      setFormData({ ...formData, billingCycle: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chargePerPerson">Valor Cobrado por Pessoa/Dia (R$) *</Label>
                  <Input
                    id="chargePerPerson"
                    type="number"
                    step="0.01"
                    value={formData.chargePerPerson}
                    onChange={(e) => setFormData({ ...formData, chargePerPerson: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createContract.isPending}>
                  {createContract.isPending ? "Criando..." : "Criar Contrato"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {contracts && contracts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum contrato cadastrado</p>
            </CardContent>
          </Card>
        )}

        {contracts?.map((contract) => {
          const client = clients?.find(c => c.id === contract.clientId);
          const rates = JSON.parse(contract.dailyRates);
          
          return (
            <Card key={contract.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{contract.contractName}</CardTitle>
                    <CardDescription>{client?.companyName}</CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    contract.status === 'active' ? 'bg-green-100 text-green-800' :
                    contract.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {contract.status === 'active' ? 'Ativo' :
                     contract.status === 'inactive' ? 'Inativo' : 'Expirado'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Início</p>
                    <p className="font-medium">
                      {new Date(contract.startDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  {contract.endDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Término</p>
                      <p className="font-medium">
                        {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Faturamento</p>
                    <p className="font-medium">
                      {contract.billingCycle === 'weekly' ? 'Semanal' :
                       contract.billingCycle === 'biweekly' ? 'Quinzenal' : 'Mensal'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Valor/Pessoa/Dia</p>
                    <p className="font-medium flex items-center">
                      <DollarSign className="w-4 h-4" />
                      {parseFloat(contract.chargePerPerson).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-2">Valores por Função:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {Object.entries(rates).map(([func, value]) => (
                      <div key={func} className="flex justify-between">
                        <span className="capitalize">{func}:</span>
                        <span className="font-medium">R$ {String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${contract.providesUniform ? 'bg-green-500' : 'bg-gray-300'}`} />
                    Uniforme
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${contract.providesEpi ? 'bg-green-500' : 'bg-gray-300'}`} />
                    EPI
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${contract.providesMeal ? 'bg-green-500' : 'bg-gray-300'}`} />
                    Marmita (R$ {parseFloat(contract.mealCost || '0').toFixed(2)})
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
