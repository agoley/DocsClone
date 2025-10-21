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
          <Route path="*" element={
            <div style={{padding: '20px'}}>
              <h2>404 - Page Not Found</h2>
              <p>Current URL: {window.location.pathname}</p>
              <p>Available routes:</p>
              <ul>
                <li>/</li>
                <li>/documents/:id</li>
                <li>/shared/:shareId</li>
                <li>/debug</li>
              </ul>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}

export default App;
