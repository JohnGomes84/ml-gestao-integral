import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Workers from "./pages/Workers";
import Clients from "./pages/Clients";
import Allocations from "./pages/Allocations";
import Contracts from "./pages/Contracts";
import Supervisor from "./pages/Supervisor";
import BiweeklyReport from "./pages/BiweeklyReport";
import WorkerRegistrationForm from "./pages/WorkerRegistrationForm";
import CreateOperation from "./pages/CreateOperation";
import WorkerDetails from "./pages/WorkerDetails";
import PendingWorkerApprovals from "./pages/PendingWorkerApprovals";
import LeaderDashboard from "./pages/LeaderDashboard";
import OperationAccept from "./pages/OperationAccept";
import OperationDetails from "./pages/OperationDetails";
import ComplianceManagement from "./pages/ComplianceManagement";
import Shifts from "./pages/Shifts";
import RiskDashboard from "./pages/RiskDashboard";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/trabalhadores"} component={Workers} />
      <Route path={"/clientes"} component={Clients} />
      <Route path={"/alocacoes"} component={Allocations} />
      <Route path={"/contratos"} component={Contracts} />
      <Route path={"/turnos"} component={Shifts} />
      <Route path={"/relatorios/quinzenal"} component={BiweeklyReport} />
      <Route path={"/supervisor"} component={Supervisor} />
        <Route path="/cadastro-trabalhador" component={WorkerRegistrationForm} />
        <Route path="/criar-operacao" component={CreateOperation} />
        <Route path="/trabalhadores/:id" component={WorkerDetails} />
        <Route path="/trabalhadores-pendentes" component={PendingWorkerApprovals} />
        <Route path="/lider/dashboard" component={LeaderDashboard} />
        <Route path="/operacao/aceitar/:memberId" component={OperationAccept} />
        <Route path="/lider/operacao/:id" component={OperationDetails} />
        <Route path="/conformidade" component={ComplianceManagement} />
        <Route path="/riscos" component={RiskDashboard} />
      <Route path={"/home"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
