import React from "react";
import { Routes, Route } from "react-router-dom";
import DocumentList from "./pages/DocumentList";
import DocumentEditor from "./pages/DocumentEditor";
import SharedDocument from "./pages/SharedDocument";
import ApiDebugger from "./components/ApiDebugger";
import RouteHandler from "./components/RouteHandler";

function App() {
  return (
    <div className="App">
      <RouteHandler>
        <Routes>
          <Route path="/" element={<DocumentList />} />
          <Route path="/index.html" element={<DocumentList />} />
          <Route path="/documents/:id" element={<DocumentEditor />} />
          <Route path="/shared/:shareId" element={<SharedDocument />} />
          <Route path="/debug" element={<ApiDebugger />} />
          <Route
            path="*"
            element={
              <div className="docs-404">
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌪️</div>
                <h2>404 - Lost in the Wind</h2>
                <p>The page you're looking for has blown away...</p>
                <p>Current URL: {window.location.pathname}</p>
                <p>Available routes:</p>
                <ul>
                  <li>/ - SkyWrite Home</li>
                  <li>/documents/:id - Document Editor</li>
                  <li>/shared/:shareId - Shared Documents</li>
                  <li>/debug - Debug Tools</li>
                </ul>
              </div>
            }
          />
        </Routes>
      </RouteHandler>
    </div>
  );
}

export default App;
