// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Download, FileText, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

export default function BiweeklyReport() {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [period, setPeriod] = useState<"first" | "second">("first");
  const [clientId, setClientId] = useState<number | undefined>(undefined);

  // Buscar lista de clientes
  const { data: clientsList } = trpc.clients.list.useQuery();

  const {
    data: reportData,
    isLoading,
    refetch,
  } = trpc.reports.biweeklyReport.useQuery({
    year,
    month,
    period,
    clientId,
  });

  const handleExport = () => {
    if (!reportData) return;

    // Criar workbook
    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo por Cliente
    const summaryData = reportData.summary.flatMap(client =>
      client.shifts.map(shift => ({
        Cliente: client.clientName,
        Turno: shift.shiftName,
        "Pessoas-Dia": shift.personDays,
        Trabalhadores: shift.workerCount,
      }))
    );
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "Resumo");

    // Aba 2: Detalhamento
    const detailsData = reportData.details.map(detail => ({
      Data: new Date(detail.workDate).toLocaleDateString("pt-BR"),
      Cliente: detail.clientName,
      Turno: detail.shiftName,
      Trabalhador: detail.workerName,
      Local: detail.locationName,
      Função: detail.jobFunction || "-",
      Diária: detail.dailyRate
        ? `R$ ${parseFloat(detail.dailyRate).toFixed(2)}`
        : "-",
      Marmita: detail.tookMeal ? "Sim" : "Não",
      "Custo Marmita": detail.mealCost
        ? `R$ ${parseFloat(detail.mealCost).toFixed(2)}`
        : "-",
      "Valor Líquido": detail.netPay
        ? `R$ ${parseFloat(detail.netPay).toFixed(2)}`
        : "-",
    }));
    const ws2 = XLSX.utils.json_to_sheet(detailsData);
    XLSX.utils.book_append_sheet(wb, ws2, "Detalhamento");

    // Salvar arquivo
    XLSX.writeFile(
      wb,
      `relatorio-quinzenal-${year}-${String(month).padStart(2, "0")}-${period}.xlsx`
    );
  };

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => currentDate.getFullYear() - i
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Relatório Quinzenal de Pessoas-Dia
          </h1>
          <p className="text-slate-600 mt-1">
            Faturamento por cliente e turno para emissão de notas fiscais
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Selecionar Período
            </CardTitle>
            <CardDescription>
              Escolha o ano, mês e quinzena para gerar o relatório
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Cliente */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Cliente
                </label>
                <Select
                  value={clientId?.toString() || "all"}
                  onValueChange={v =>
                    setClientId(v === "all" ? undefined : parseInt(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {clientsList?.map(client => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ano */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Ano
                </label>
                <Select
                  value={year.toString()}
                  onValueChange={v => setYear(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mês */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Mês
                </label>
                <Select
                  value={month.toString()}
                  onValueChange={v => setMonth(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quinzena */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Quinzena
                </label>
                <Select
                  value={period}
                  onValueChange={v => setPeriod(v as "first" | "second")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">
                      1ª Quinzena (dias 1-15)
                    </SelectItem>
                    <SelectItem value="second">
                      2ª Quinzena (dias 16-fim)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botão Gerar */}
              <div className="flex items-end">
                <Button onClick={() => refetch()} className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Carregando relatório...</p>
            </CardContent>
          </Card>
        )}

        {/* Resumo */}
        {!isLoading && reportData && (
          <>
            {/* Cards de Totais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Total de Pessoas-Dia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {reportData.totalPersonDays}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Clientes Atendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {reportData.summary.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Período
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-slate-900">
                    {reportData.period?.startDate} a{" "}
                    {reportData.period?.endDate}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Botão Exportar */}
            <div className="mb-4 flex justify-end">
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>

            {/* Resumo por Cliente */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Resumo por Cliente e Turno</CardTitle>
                <CardDescription>
                  Agrupamento de pessoas-dia para faturamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.summary.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Nenhuma alocação confirmada encontrada neste período
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reportData.summary.map(client => (
                      <div
                        key={client.clientId}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {client.clientName}
                            </h3>
                            <p className="text-sm text-slate-600">
                              Total: <strong>{client.totalPersonDays}</strong>{" "}
                              pessoas-dia
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-lg px-4 py-2"
                          >
                            {client.totalPersonDays} PD
                          </Badge>
                        </div>

                        {/* Turnos */}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Turno</TableHead>
                              <TableHead className="text-right">
                                Pessoas-Dia
                              </TableHead>
                              <TableHead className="text-right">
                                Trabalhadores
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {client.shifts.map((shift, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {shift.shiftName}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="secondary">
                                    {shift.personDays}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-slate-600">
                                  {shift.workerCount}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detalhamento */}
            {reportData.details.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento Completo</CardTitle>
                  <CardDescription>
                    Lista de todas as alocações confirmadas no período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Turno</TableHead>
                          <TableHead>Trabalhador</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead>Função</TableHead>
                          <TableHead className="text-right">Diária</TableHead>
                          <TableHead className="text-center">Marmita</TableHead>
                          <TableHead className="text-right">Líquido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.details.map((detail, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {new Date(detail.workDate).toLocaleDateString(
                                "pt-BR"
                              )}
                            </TableCell>
                            <TableCell>{detail.clientName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {detail.shiftName}
                              </Badge>
                            </TableCell>
                            <TableCell>{detail.workerName}</TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {detail.locationName}
                            </TableCell>
                            <TableCell className="text-sm">
                              {detail.jobFunction || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {detail.dailyRate
                                ? `R$ ${parseFloat(detail.dailyRate).toFixed(2)}`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {detail.tookMeal ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-700"
                                >
                                  Sim
                                </Badge>
                              ) : (
                                <span className="text-slate-400">Não</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              {detail.netPay
                                ? `R$ ${parseFloat(detail.netPay).toFixed(2)}`
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
