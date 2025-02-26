// DOM Elements
const excelFileInput = document.getElementById("excel-file");
const poTableBody = document.querySelector("#po-table tbody");

// Function to fetch and parse the Excel file
async function fetchAndParseExcel() {
    try {
      // Fetch the Excel file from the local server
      const response = await fetch("material.xlsx");
      if (!response.ok) {
        throw new Error("Failed to fetch the Excel file.");
      }
  
      // Convert the response to an array buffer
      const data = await response.arrayBuffer();
  
      // Parse the Excel file
      const workbook = XLSX.read(data, { type: "array" });
  
      // Assuming the first sheet is the one we need
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
  
      // Convert sheet data to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
      // Remove blank rows
      const filteredData = jsonData.filter((row) => {
        // Check if any cell in the row is not empty
        return row.some((cell) => cell !== null && cell !== "");
      });
  
      // Map JSON data to PO objects (assuming first row is headers)
      const headers = filteredData[0]; // First row contains headers
      const poData = filteredData.slice(1).map((row) => {
        const po = {};
        headers.forEach((header, index) => {
          po[header] = row[index] || ""; // Use empty string if cell is blank
        });
        return po;
      });
  
      // Group data by PO number
      const groupedData = {};
      poData.forEach((po) => {
        const poNumber = po.po_number;
        if (!groupedData[poNumber]) {
          groupedData[poNumber] = []; // Initialize an array for the PO number
        }
        groupedData[poNumber].push(po); // Add the row to the group
      });
  
      // Sort the grouped data by PO number (ascending order)
      const sortedGroupedData = Object.keys(groupedData)
        .sort((a, b) => {
          const getNumericPart = (poNumber) => {
            const matches = poNumber.match(/\d+$/); // Match the last sequence of digits
            return matches ? parseInt(matches[0], 10) : 0; // Convert to integer
          };
          const poNumberA = getNumericPart(a);
          const poNumberB = getNumericPart(b);
          return poNumberA - poNumberB; // Sort in ascending order
        })
        .reduce((acc, poNumber) => {
          acc[poNumber] = groupedData[poNumber]; // Add sorted groups to the result
          return acc;
        }, {});
  
      // Render the table with the grouped and sorted data
      renderGroupedTable(sortedGroupedData);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to load the Excel file. Please try again.");
    }
  }
  
  // Function to render the grouped table
  function renderGroupedTable(groupedData) {
    poTableBody.innerHTML = ""; // Clear existing rows
  
    // Loop through each PO number group
    Object.keys(groupedData).forEach((poNumber) => {
      const group = groupedData[poNumber];
  
      // Add a header row for the PO number
      const headerRow = document.createElement("tr");
      headerRow.innerHTML = `
        <td colspan="5" style="background-color: #f1f1f1; font-weight: bold;">PO Number: ${poNumber}</td>
      `;
      poTableBody.appendChild(headerRow);
  
      // Add rows for each item in the group
      group.forEach((po) => {
        const row = document.createElement("tr");
        // Format Shape, Dim1, Dim2, and Dim3 as "W 21x44"
        let dimensions = `${po.shape} ${po.dim1 || ''}x${po.dim2 || ''}x${po.dim3 || ''}`;
        const length = `${po.length_feet || 0}'-${po.length_inches || 0}"`;
        // Remove trailing "x" and extra "x" separators
        dimensions = dimensions.replace(/x+/g, 'x').replace(/x$/, '');
        row.innerHTML = `
          <td>${po.po_number}</td>
          <td>${po.qty_open}</td>
          <td>${dimensions}</td>
          <td>${length}</td>
          <td>${po.name}</td>
        `;
        poTableBody.appendChild(row);
      });
    });
  }
  
  // Fetch and parse the Excel file when the page loads
  document.addEventListener("DOMContentLoaded", fetchAndParseExcel);