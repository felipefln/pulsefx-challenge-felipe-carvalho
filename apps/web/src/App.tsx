import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { IndicatorDetailPage } from "./features/indicator-detail/IndicatorDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="indicators/:code" element={<IndicatorDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
