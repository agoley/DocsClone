import React from "react";
import { Routes, Route } from "react-router-dom";
import DocumentList from "./pages/DocumentList";
import DocumentEditor from "./pages/DocumentEditor";
import SharedDocument from "./pages/SharedDocument";
import Navbar from "./components/Navbar";
import ApiDebugger from "./components/ApiDebugger";

function App() {
  return (
    <div className="App">
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<DocumentList />} />
          <Route path="/documents/:id" element={<DocumentEditor />} />
          <Route path="/shared/:shareId" element={<SharedDocument />} />
          <Route path="/debug" element={<ApiDebugger />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
