
export const exportToCSV = (data: any[], filename: string, headers?: Record<string, string>) => {
  if (!data || data.length === 0) {
    alert("não há dados para exportar.");
    return;
  }

  // 1. Determine columns (keys)
  const keys = Object.keys(data[0]);

  // 2. Create Header Row
  const headerRow = keys.map(key => {
      // Use custom header label if provided, else use key
      const label = headers && headers[key] ? headers[key] : key;
      return `"${label}"`;
  }).join(',');

  // 3. Create Body Rows
  const bodyRows = data.map(row => {
    return keys.map(key => {
      let val = row[key];
      
      // Handle null/undefined
      if (val === null || val === undefined) val = '';
      
      // Handle dates (if string looks like date)
      if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
          // Keep ISO format or format to PT-BR? 
          // CSV standard usually prefers ISO for machine reading, but Excel likes local.
          // Let's keep distinct string to avoid Excel messing up.
      }

      // Escape quotes and wrap in quotes
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    }).join(',');
  });

  // 4. Combine
  const csvContent = [headerRow, ...bodyRows].join('\n');

  // 5. Create Blob and Download
  // Add BOM for Excel to recognize UTF-8
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
