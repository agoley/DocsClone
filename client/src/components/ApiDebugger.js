import React, { useState, useEffect } from 'react';
import { documentsApi } from '../services/api';

const ApiDebugger = () => {
  const [allDocuments, setAllDocuments] = useState([]);
  const [document1, setDocument1] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAPI = async () => {
      setLoading(true);
      
      // Test 1: Get all documents
      try {
        console.log('Testing: Get all documents');
        const docs = await documentsApi.getAllDocuments();
        console.log('All documents:', docs);
        setAllDocuments(docs);
      } catch (err) {
        console.error('Error getting all documents:', err);
        setErrors(prev => ({ ...prev, allDocs: err.message }));
      }

      // Test 2: Get document by ID 1
      try {
        console.log('Testing: Get document by ID 1');
        const doc = await documentsApi.getDocumentById(1);
        console.log('Document 1:', doc);
        setDocument1(doc);
      } catch (err) {
        console.error('Error getting document 1:', err);
        setErrors(prev => ({ ...prev, doc1: err.message }));
      }

      // Test 3: Create a test document if none exist
      if (allDocuments.length === 0) {
        try {
          console.log('Testing: Create a test document');
          const newDoc = await documentsApi.createDocument({
            title: 'Test Document',
            content: 'This is a test document created for debugging.'
          });
          console.log('Created test document:', newDoc);
        } catch (err) {
          console.error('Error creating test document:', err);
          setErrors(prev => ({ ...prev, create: err.message }));
        }
      }

      setLoading(false);
    };

    testAPI();
  }, []);

  if (loading) {
    return <div>Testing API...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>API Debug Results</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>All Documents ({allDocuments.length}):</h3>
        {errors.allDocs ? (
          <div style={{ color: 'red' }}>Error: {errors.allDocs}</div>
        ) : (
          <pre>{JSON.stringify(allDocuments, null, 2)}</pre>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Document ID 1:</h3>
        {errors.doc1 ? (
          <div style={{ color: 'red' }}>Error: {errors.doc1}</div>
        ) : document1 ? (
          <pre>{JSON.stringify(document1, null, 2)}</pre>
        ) : (
          <div>No document with ID 1 found</div>
        )}
      </div>

      {errors.create && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Create Document Error:</h3>
          <div style={{ color: 'red' }}>{errors.create}</div>
        </div>
      )}
    </div>
  );
};

export default ApiDebugger;