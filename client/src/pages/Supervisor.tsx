// @ts-nocheck
import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  MapPin,
  User,
  Utensils,
  ShieldCheck,
  Shirt,
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Supervisor() {
  const { user, loading, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedAllocation, setSelectedAllocation] = useState<number | null>(
    null
  );
  const [checkInData, setCheckInData] = useState({
    tookMeal: false,
    uniformProvided: false,
    epiProvided: false,
  });
  const [checkOutNotes, setCheckOutNotes] = useState("");
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const utils = trpc.useUtils();
  const { data: allocations, isLoading } =
    trpc.supervisor.todayAllocations.useQuery({
      date: selectedDate,
    });

  const checkIn = trpc.supervisor.checkIn.useMutation({
    onSuccess: (data: any) => {
      if (data.distanceWarning) {
        toast.warning(data.distanceWarning, { duration: 8000 });
      } else {
        toast.success("Entrada confirmada com sucesso!");
      }
      setSelectedAllocation(null);
      utils.supervisor.todayAllocations.invalidate();
      clearSignature();
    },
    onError: error => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const checkOut = trpc.supervisor.checkOut.useMutation({
    onSuccess: () => {
      toast.success("Saída confirmada com sucesso!");
      setSelectedAllocation(null);
      setCheckOutNotes("");
      utils.supervisor.todayAllocations.invalidate();
      clearSignature();
    },
    onError: error => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Signature handling
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const x =
      "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y =
      "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const x =
      "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y =
      "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getSignatureData = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL();
  };

  const handleCheckIn = (allocationId: number) => {
    const signature = getSignatureData();
    if (!signature || signature === signatureCanvasRef.current?.toDataURL()) {
      toast.error("Por favor, assine antes de confirmar");
      return;
    }

    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const location = `${position.coords.latitude},${position.coords.longitude}`;
          checkIn.mutate({
            allocationId,
            ...checkInData,
            workerSignature: signature,
            location,
          });
        },
        () => {
          // If geolocation fails, proceed without it
          checkIn.mutate({
            allocationId,
            ...checkInData,
            workerSignature: signature,
          });
        }
      );
    } else {
      checkIn.mutate({
        allocationId,
        ...checkInData,
        workerSignature: signature,
      });
    }
  };

  const handleCheckOut = (allocationId: number) => {
    const signature = getSignatureData();
    if (!signature) {
      toast.error("Por favor, assine antes de confirmar");
      return;
    }

    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const location = `${position.coords.latitude},${position.coords.longitude}`;
          checkOut.mutate({
            allocationId,
            workerSignature: signature,
            location,
            notes: checkOutNotes,
          });
        },
        () => {
          checkOut.mutate({
            allocationId,
            workerSignature: signature,
            notes: checkOutNotes,
          });
        }
      );
    } else {
      checkOut.mutate({
        allocationId,
        workerSignature: signature,
        notes: checkOutNotes,
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Supervisor - ML Serviços</CardTitle>
            <CardDescription>
              Faça login para confirmar presença dos trabalhadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Entrar com Manus</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedAlloc = allocations?.find(a => a.id === selectedAllocation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-20">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Supervisor</h1>
              <p className="text-sm text-slate-600">{user?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {new Date(selectedDate).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {!selectedAllocation ? (
          <>
            {/* Date Selector */}
            <div className="mb-6">
              <Label
                htmlFor="date"
                className="text-base font-semibold mb-2 block"
              >
                Selecionar Data
              </Label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full p-3 border rounded-lg text-lg"
              />
            </div>

            {/* Allocations List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Alocações do Dia ({allocations?.length || 0})
              </h2>

              {allocations && allocations.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma alocação para este dia
                    </p>
                  </CardContent>
                </Card>
              )}

              {allocations?.map(allocation => (
                <Card
                  key={allocation.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedAllocation(allocation.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Trabalhador #{allocation.workerId}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {allocation.jobFunction || "Função não especificada"}
                        </CardDescription>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          allocation.status === "scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : allocation.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : allocation.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {allocation.status === "scheduled"
                          ? "Agendado"
                          : allocation.status === "in_progress"
                            ? "Em andamento"
                            : allocation.status === "completed"
                              ? "Concluído"
                              : allocation.status}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4" />
                        Local #{allocation.locationId}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        {allocation.checkInTime
                          ? `Entrada: ${new Date(allocation.checkInTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                          : "Aguardando entrada"}
                      </div>
                      {allocation.status === "in_progress" && (
                        <div className="mt-3 pt-3 border-t">
                          <Button className="w-full" variant="default">
                            Registrar Saída
                          </Button>
                        </div>
                      )}
                      {allocation.status === "scheduled" && (
                        <div className="mt-3 pt-3 border-t">
                          <Button className="w-full" variant="default">
                            Confirmar Entrada
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Check-in/Check-out Form */}
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => {
                setSelectedAllocation(null);
                clearSignature();
              }}
            >
              ← Voltar
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {selectedAlloc?.status === "scheduled"
                    ? "Confirmar Entrada"
                    : "Registrar Saída"}
                </CardTitle>
                <CardDescription>
                  Trabalhador #{selectedAlloc?.workerId} -{" "}
                  {selectedAlloc?.jobFunction}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedAlloc?.status === "scheduled" && (
                  <>
                    {/* Check-in Checklist */}
                    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                      <h3 className="font-semibold text-sm">
                        Checklist de Entrada
                      </h3>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="tookMeal"
                          className="flex items-center gap-2"
                        >
                          <Utensils className="w-4 h-4" />
                          Pegou Marmita?
                        </Label>
                        <Switch
                          id="tookMeal"
                          checked={checkInData.tookMeal}
                          onCheckedChange={checked =>
                            setCheckInData({
                              ...checkInData,
                              tookMeal: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="uniformProvided"
                          className="flex items-center gap-2"
                        >
                          <Shirt className="w-4 h-4" />
                          Uniforme Fornecido?
                        </Label>
                        <Switch
                          id="uniformProvided"
                          checked={checkInData.uniformProvided}
                          onCheckedChange={checked =>
                            setCheckInData({
                              ...checkInData,
                              uniformProvided: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="epiProvided"
                          className="flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          EPI Completo?
                        </Label>
                        <Switch
                          id="epiProvided"
                          checked={checkInData.epiProvided}
                          onCheckedChange={checked =>
                            setCheckInData({
                              ...checkInData,
                              epiProvided: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}

                {selectedAlloc?.status === "in_progress" && (
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Textarea
                      id="notes"
                      value={checkOutNotes}
                      onChange={e => setCheckOutNotes(e.target.value)}
                      rows={3}
                      placeholder="Adicione observações sobre o turno..."
                    />
                  </div>
                )}

                {/* Signature Canvas */}
                <div className="space-y-2">
                  <Label>Assinatura do Trabalhador</Label>
                  <div className="border-2 border-dashed rounded-lg p-2 bg-white">
                    <canvas
                      ref={signatureCanvasRef}
                      width={300}
                      height={150}
                      className="w-full touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{ touchAction: "none" }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    className="w-full"
                  >
                    Limpar Assinatura
                  </Button>
                </div>

                {/* Submit Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    if (selectedAlloc?.status === "scheduled") {
                      handleCheckIn(selectedAlloc.id);
                    } else if (selectedAlloc?.status === "in_progress") {
                      handleCheckOut(selectedAlloc.id);
                    }
                  }}
                  disabled={checkIn.isPending || checkOut.isPending}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {selectedAlloc?.status === "scheduled"
                    ? "Confirmar Entrada"
                    : "Confirmar Saída"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
