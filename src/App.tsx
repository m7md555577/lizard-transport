import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import SchoolNotice from "@/components/SchoolNotice";
import Home from "@/pages/Home";
import Calculator from "@/pages/Calculator";
import Distance from "@/pages/Distance";
import Driver from "@/pages/Driver";
import Tracking from "@/pages/Tracking";
import Incoterms from "@/pages/Incoterms";
import Documents from "@/pages/Documents";
import LogisticsTools from "@/pages/LogisticsTools";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/distance" component={Distance} />
      <Route path="/driver" component={Driver} />
      <Route path="/tracking" component={Tracking} />
      <Route path="/incoterms" component={Incoterms} />
      <Route path="/documents" component={Documents} />
      <Route path="/tools" component={LogisticsTools} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div className="min-h-screen flex flex-col bg-[#f8f9fb] dark:bg-slate-900 transition-colors duration-200">
            <Navbar />
            <SchoolNotice />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
            <Chatbot />
          </div>
        </WouterRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
