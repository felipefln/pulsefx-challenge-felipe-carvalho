import { Outlet } from "react-router-dom";
import { Disclaimer } from "./Disclaimer";

/** Casca comum a todas as páginas — só acrescenta o disclaimer, cada página mantém seu próprio título. */
export function Layout() {
  return (
    <>
      <Outlet />
      <Disclaimer />
    </>
  );
}
