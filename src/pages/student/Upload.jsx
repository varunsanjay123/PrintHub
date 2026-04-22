import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrint } from '../../contexts/PrintContext';
import { Upload as UploadIcon, Plus, Minus, X } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PDFDocument } from 'pdf-lib';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [printType, setPrintType] = useState('Normal Xerox');
  const [copies, setCopies] = useState(1);
  const [colorPrint, setColorPrint] = useState(false);
  const [doubleSided, setDoubleSided] = useState(false);
  const [message, setMessage] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [calculatingPages, setCalculatingPages] = useState(false);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const { submitOrder, serverActive } = usePrint();
  const navigate = useNavigate();

  const calculateTotalPages = async (fileList) => {
    setCalculatingPages(true);
    let total = 0;
    try {
      for (const file of fileList) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        total += pdfDoc.getPageCount();
      }
      setTotalPages(total);
    } catch (error) {
      console.error("Error counting pages:", error);
      toast.error("Could not read some PDF pages. Price might be inaccurate.");
    } finally {
      setCalculatingPages(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length === 0) return;
    
    // Validate each file
    const validFiles = selectedFiles.filter(file => {
      // Check file type - only allow PDFs
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF file`);
        return false;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`);
        return false;
      }
      
      return true;
    });
    
    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    calculateTotalPages(updatedFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    if (!serverActive) {
      toast.error("Server is offline. Document uploads are disabled.");
      return;
    }
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (droppedFiles.length === 0) return;
    
    // Validate each file
    const validFiles = droppedFiles.filter(file => {
      // Check file type - only allow PDFs
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF file`);
        return false;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`);
        return false;
      }
      
      return true;
    });
    
    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    calculateTotalPages(updatedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    calculateTotalPages(updatedFiles);
  };

  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serverActive) {
      toast.error("Server is offline. Document uploads are disabled.");
      return;
    }
    
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    setSubmitting(true);
    const uploadToastId = toast.loading(`Preparing ${files.length} file(s)...`);
    
    try {
      const uploadedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        toast.loading(`Uploading file ${i + 1} of ${files.length}: ${file.name}...`, { id: uploadToastId });
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        // Timeout helper
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Upload timed out for ${file.name}. Check your connection.`)), 45000)
        );

        // Upload with timeout
        const uploadPromise = supabase.storage
          .from('documents')
          .upload(fileName, file);

        const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]);
          
        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
        uploadedFiles.push({ name: file.name, url: publicUrl });
      }
      
      toast.loading("Creating your order...", { id: uploadToastId });
      
      // Submit a single order with all files
      const order = await submitOrder(
        uploadedFiles,
        printType,
        copies,
        colorPrint,
        doubleSided,
        message
      );
      
      if (order) {
        toast.success("Order submitted successfully!", { id: uploadToastId });
        navigate(`/student/payment/${order.id}`);
      } else {
        toast.error("Failed to create order. Please try again.", { id: uploadToastId });
      }
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error(error.message || "An error occurred during submission. Please check your internet.", { id: uploadToastId });
    } finally {
      setSubmitting(false);
    }
  };

  const incrementCopies = () => {
    setCopies(prev => Math.min(prev + 1, 100));
  };

  const decrementCopies = () => {
    setCopies(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Submit Print Order</h2>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF Files</label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                multiple
                className="hidden"
                disabled={!serverActive}
              />
              {files.length > 0 ? (
                <div className="space-y-4">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center">
                        <div className="text-green-600 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="mt-4 text-primary hover:text-indigo-700 text-sm font-medium"
                    onClick={handleFileInputClick}
                  >
                    Add more files
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadIcon className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-primary text-lg font-medium mb-1">Upload files</p>
                  <p className="text-sm text-gray-500 mb-4">or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF up to 10MB</p>
                  <button
                    type="button"
                    onClick={handleFileInputClick}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    disabled={!serverActive}
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Print Type</label>
              <select
                value={printType}
                onChange={(e) => setPrintType(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="Normal Xerox">Normal Xerox</option>
                <option value="Glossy Print">Glossy Print</option>
                <option value="Matte Print">Matte Print</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Copies</label>
              <div className="flex items-center">
                <button 
                  type="button"
                  onClick={decrementCopies}
                  className="p-2 border rounded-l-md bg-gray-100 hover:bg-gray-200"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <input
                  type="number"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="100"
                  className="w-full p-3 border-y focus:ring-primary focus:border-primary text-center"
                />
                <button 
                  type="button"
                  onClick={incrementCopies}
                  className="p-2 border rounded-r-md bg-gray-100 hover:bg-gray-200"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-x-8 gap-y-4 mb-6">
            <div className="flex items-center">
              <input
                id="colorPrint"
                type="checkbox"
                checked={colorPrint}
                onChange={(e) => setColorPrint(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="colorPrint" className="ml-2 block text-sm text-gray-700">
                Color Print
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="doubleSided"
                type="checkbox"
                checked={doubleSided}
                onChange={(e) => setDoubleSided(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="doubleSided" className="ml-2 block text-sm text-gray-700">
                Double Sided
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4"
              className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
              placeholder="Any special instructions..."
            ></textarea>
          </div>
          
          <div className="mb-8 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center">
              <span className="mr-2">💰</span> Price Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-indigo-700">
                <span>Total Pages:</span>
                <span className="font-medium">{calculatingPages ? 'Calculating...' : totalPages}</span>
              </div>
              <div className="flex justify-between text-sm text-indigo-700">
                <span>Price per Page:</span>
                <span className="font-medium">₹2.00</span>
              </div>
              <div className="flex justify-between text-sm text-indigo-700">
                <span>Number of Copies:</span>
                <span className="font-medium">x {copies}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-indigo-200 flex justify-between text-lg font-bold text-indigo-900">
                <span>Total Amount:</span>
                <span>₹{(totalPages * 2 * copies).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[10px] text-indigo-400 mt-2 italic">
              * Base price is ₹2 per page. Final amount may vary based on print options.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !serverActive || files.length === 0 || calculatingPages}
              className="px-8 py-3 bg-primary text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-bold text-lg shadow-md transition-all active:scale-[0.98]"
            >
              {submitting ? 'Submitting Order...' : `Pay ₹${(totalPages * 2 * copies).toFixed(2)} & Submit`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;