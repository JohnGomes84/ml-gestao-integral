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
import { trpc } from "@/lib/trpc";
import { Building2, MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Clients() {
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  
  const [clientFormData, setClientFormData] = useState({
    companyName: "",
    cnpj: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);

  const handleCNPJLookup = async (cnpj: string) => {
    // Remove non-numeric characters
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) {
      toast.error('CNPJ deve ter 14 dígitos');
      return;
    }

    setIsLoadingCNPJ(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      
      if (!response.ok) {
        throw new Error('CNPJ não encontrado');
      }

      const data = await response.json();
      
      setClientFormData({
        ...clientFormData,
        companyName: data.razao_social || data.nome_fantasia || '',
        contactPhone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}` : '',
        contactEmail: data.email || '',
        street: data.logradouro || '',
        number: data.numero || '',
        complement: data.complemento || '',
        neighborhood: data.bairro || '',
        city: data.municipio || '',
        state: data.uf || '',
        zipCode: data.cep || '',
      });
      
      toast.success('Dados da empresa carregados!');
    } catch (error) {
      toast.error('Erro ao buscar CNPJ. Verifique o número e tente novamente.');
    } finally {
      setIsLoadingCNPJ(false);
    }
  };

  const [locationFormData, setLocationFormData] = useState({
    locationName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery();
  
  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      setIsClientDialogOpen(false);
      setClientFormData({
        companyName: "",
        cnpj: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const createLocation = trpc.locations.create.useMutation({
    onSuccess: () => {
      toast.success("Local cadastrado com sucesso!");
      setIsLocationDialogOpen(false);
      setLocationFormData({
        locationName: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClient.mutate(clientFormData);
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error("Selecione um cliente primeiro");
      return;
    }
    createLocation.mutate({
      clientId: selectedClientId,
      ...locationFormData,
    });
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
              <p className="text-sm text-slate-600">Gerenciar Clientes</p>
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
            <h1 className="text-2xl font-bold text-slate-900">🏢 Clientes</h1>
            <p className="text-slate-600">
              {clients?.length || 0} cliente(s) cadastrado(s)
            </p>
          </div>

          <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleClientSubmit}>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do cliente. Campos com * são obrigatórios.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="companyName">Nome da Empresa *</Label>
                    <Input
                      id="companyName"
                      value={clientFormData.companyName}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, companyName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="cnpj">CNPJ * (Digite e pressione Tab para buscar)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cnpj"
                        placeholder="00.000.000/0000-00"
                        value={clientFormData.cnpj}
                        onChange={(e) =>
                          setClientFormData({ ...clientFormData, cnpj: e.target.value })
                        }
                        onBlur={(e) => {
                          if (e.target.value && e.target.value.length >= 14) {
                            handleCNPJLookup(e.target.value);
                          }
                        }}
                        disabled={isLoadingCNPJ}
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleCNPJLookup(clientFormData.cnpj)}
                        disabled={isLoadingCNPJ || !clientFormData.cnpj}
                      >
                        {isLoadingCNPJ ? "Buscando..." : "Buscar"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contactName">Nome do Contato</Label>
                    <Input
                      id="contactName"
                      value={clientFormData.contactName}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, contactName: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contactPhone">Telefone do Contato</Label>
                    <Input
                      id="contactPhone"
                      placeholder="(00) 00000-0000"
                      value={clientFormData.contactPhone}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, contactPhone: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contactEmail">E-mail do Contato</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="contato@empresa.com"
                      value={clientFormData.contactEmail}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, contactEmail: e.target.value })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsClientDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createClient.isPending}>
                    {createClient.isPending ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Clients List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando clientes...</p>
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="space-y-6">
            {clients.map((client) => (
              <Card key={client.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{client.companyName}</CardTitle>
                      <CardDescription className="mt-1">
                        CNPJ: {client.cnpj}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setIsLocationDialogOpen(true);
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Adicionar Local
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {client.contactName && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium text-slate-900">Contato:</p>
                      <p className="text-sm text-slate-600">{client.contactName}</p>
                      {client.contactPhone && (
                        <p className="text-sm text-slate-600">{client.contactPhone}</p>
                      )}
                      {client.contactEmail && (
                        <p className="text-sm text-slate-600">{client.contactEmail}</p>
                      )}
                    </div>
                  )}

                  {/* Locations */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-2">
                      📍 Locais de Trabalho
                    </h4>
                    {client.locations && client.locations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {client.locations.map((location) => (
                          <div
                            key={location.id}
                            className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                          >
                            <p className="font-medium text-slate-900">{location.locationName}</p>
                            <p className="text-sm text-slate-600 mt-1">{location.address}</p>
                            {location.city && location.state && (
                              <p className="text-sm text-slate-600">
                                {location.city} - {location.state}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        Nenhum local cadastrado ainda
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Nenhum cliente cadastrado
              </h3>
              <p className="text-slate-600 mb-4">
                Comece cadastrando seu primeiro cliente
              </p>
              <Button onClick={() => setIsClientDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Cliente
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Location Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleLocationSubmit}>
            <DialogHeader>
              <DialogTitle>Adicionar Local de Trabalho</DialogTitle>
              <DialogDescription>
                Cadastre um novo local para este cliente.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="locationName">Nome do Local *</Label>
                <Input
                  id="locationName"
                  placeholder="Ex: Armazém Central"
                  value={locationFormData.locationName}
                  onChange={(e) =>
                    setLocationFormData({ ...locationFormData, locationName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Endereço Completo *</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, complemento"
                  value={locationFormData.address}
                  onChange={(e) =>
                    setLocationFormData({ ...locationFormData, address: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={locationFormData.city}
                    onChange={(e) =>
                      setLocationFormData({ ...locationFormData, city: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="state">Estado (UF)</Label>
                  <Input
                    id="state"
                    placeholder="SP"
                    maxLength={2}
                    value={locationFormData.state}
                    onChange={(e) =>
                      setLocationFormData({ ...locationFormData, state: e.target.value.toUpperCase() })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  placeholder="00000-000"
                  value={locationFormData.zipCode}
                  onChange={(e) =>
                    setLocationFormData({ ...locationFormData, zipCode: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLocationDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createLocation.isPending}>
                {createLocation.isPending ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
