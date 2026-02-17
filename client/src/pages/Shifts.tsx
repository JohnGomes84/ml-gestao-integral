// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from "sonner";
import { Clock, Plus, Edit, Trash2, Building2 } from "lucide-react";
import { Link } from "wouter";

export default function Shifts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [shiftFormData, setShiftFormData] = useState({
    clientId: "",
    shiftName: "",
    shiftType: "morning" as
      | "morning"
      | "afternoon"
      | "night"
      | "business"
      | "custom",
    startTime: "",
    endTime: "",
  });

  const utils = trpc.useUtils();
  const { data: shifts, isLoading } = trpc.shifts.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const createShift = trpc.shifts.create.useMutation({
    onSuccess: () => {
      toast.success("Turno cadastrado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      utils.shifts.list.invalidate();
    },
    onError: error => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const updateShift = trpc.shifts.update.useMutation({
    onSuccess: () => {
      toast.success("Turno atualizado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      utils.shifts.list.invalidate();
    },
    onError: error => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteShift = trpc.shifts.delete.useMutation({
    onSuccess: () => {
      toast.success("Turno excluído com sucesso!");
      utils.shifts.list.invalidate();
    },
    onError: error => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const resetForm = () => {
    setShiftFormData({
      clientId: "",
      shiftName: "",
      shiftType: "morning",
      startTime: "",
      endTime: "",
    });
    setEditingShift(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !shiftFormData.clientId ||
      !shiftFormData.shiftName ||
      !shiftFormData.startTime ||
      !shiftFormData.endTime
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const data = {
      ...shiftFormData,
      clientId: parseInt(shiftFormData.clientId),
    };

    if (editingShift) {
      updateShift.mutate({ id: editingShift.id, ...data });
    } else {
      createShift.mutate(data);
    }
  };

  const handleEdit = (shift: any) => {
    setEditingShift(shift);
    setShiftFormData({
      clientId: shift.clientId.toString(),
      shiftName: shift.shiftName,
      shiftType: shift.shiftType,
      startTime: shift.startTime,
      endTime: shift.endTime,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este turno?")) {
      deleteShift.mutate({ id });
    }
  };

  const getShiftTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      morning: "Manhã",
      afternoon: "Tarde",
      night: "Noite",
      business: "Comercial",
      custom: "Personalizado",
    };
    return types[type] || type;
  };

  const getShiftTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      morning: "bg-yellow-100 text-yellow-800",
      afternoon: "bg-orange-100 text-orange-800",
      night: "bg-blue-100 text-blue-800",
      business: "bg-green-100 text-green-800",
      custom: "bg-purple-100 text-purple-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <p>Carregando turnos...</p>
      </div>
    );
  }

  // Group shifts by client
  const shiftsByClient = shifts?.reduce((acc: any, shift: any) => {
    const clientId = shift.clientId;
    if (!acc[clientId]) {
      acc[clientId] = [];
    }
    acc[clientId].push(shift);
    return acc;
  }, {});

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Gestão de Turnos
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure turnos personalizados para cada cliente
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={open => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Turno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingShift ? "Editar Turno" : "Novo Turno"}
              </DialogTitle>
              <DialogDescription>
                Configure os horários de trabalho para um cliente específico
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente *</Label>
                <Select
                  value={shiftFormData.clientId}
                  onValueChange={value =>
                    setShiftFormData({ ...shiftFormData, clientId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shiftType">Tipo de Turno *</Label>
                <Select
                  value={shiftFormData.shiftType}
                  onValueChange={(value: any) =>
                    setShiftFormData({ ...shiftFormData, shiftType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Manhã</SelectItem>
                    <SelectItem value="afternoon">Tarde</SelectItem>
                    <SelectItem value="night">Noite</SelectItem>
                    <SelectItem value="business">Comercial</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shiftName">Nome do Turno *</Label>
                <Input
                  id="shiftName"
                  value={shiftFormData.shiftName}
                  onChange={e =>
                    setShiftFormData({
                      ...shiftFormData,
                      shiftName: e.target.value,
                    })
                  }
                  placeholder="Ex: Manhã (6h-14h)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Horário Início *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={shiftFormData.startTime}
                    onChange={e =>
                      setShiftFormData({
                        ...shiftFormData,
                        startTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Horário Fim *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={shiftFormData.endTime}
                    onChange={e =>
                      setShiftFormData({
                        ...shiftFormData,
                        endTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingShift ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!shifts || shifts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum turno cadastrado. Clique em "Novo Turno" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(shiftsByClient || {}).map(
            ([clientId, clientShifts]: [string, any]) => {
              const client = clients?.find(
                (c: any) => c.id === parseInt(clientId)
              );
              return (
                <Card key={clientId}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {client?.companyName || `Cliente #${clientId}`}
                    </CardTitle>
                    <CardDescription>
                      {clientShifts.length} turno(s) configurado(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {clientShifts.map((shift: any) => (
                        <Card key={shift.id} className="border-2">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {shift.shiftName}
                                </h3>
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getShiftTypeColor(shift.shiftType)}`}
                                >
                                  {getShiftTypeLabel(shift.shiftType)}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(shift)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(shift.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>
                                {shift.startTime} - {shift.endTime}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      )}

      <div className="mt-8">
        <Button asChild variant="outline">
          <Link href="/">← Voltar ao Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
