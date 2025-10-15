import { useState } from "react";
import Main from "./components/Main";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ProductRegister from "./components/ProductRegister";
import ProductList from "./components/ProductList";
import type { User, Page } from "./types";

export default function App() {
  const [page, setPage] = useState<Page>("main");
  const [user, setUser] = useState<User | null>(null);

  const renderPage = () => {
    switch (page) {
      case "login":
        return <Login setPage={setPage} setUser={setUser} />;
      case "signup":
        return <Signup setPage={setPage} />;
      case "register":
        return <ProductRegister setPage={setPage} user={user} />;
      case "list":
        return <ProductList setPage={setPage} />;
      default:
        return <Main setPage={setPage} user={user} setUser={setUser} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#1a1a1a" }}>
      {renderPage()}
    </div>
  );
}