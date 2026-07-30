import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CareerInstitutes from "./pages/CareerInstitutes";
import DataManagement from "./pages/DataManagement";
import IbcOverview from "./pages/IbcOverview";
import IbcCampuses from "./pages/IbcCampuses";
import IbcPrograms from "./pages/IbcPrograms";
import IbcCerts from "./pages/IbcCerts";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="career-institutes" element={<CareerInstitutes />} />
          <Route path="data" element={<DataManagement />} />
          <Route path="ibc" element={<IbcOverview />} />
          <Route path="ibc/campuses" element={<IbcCampuses />} />
          <Route path="ibc/programs" element={<IbcPrograms />} />
          <Route path="ibc/certs" element={<IbcCerts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
