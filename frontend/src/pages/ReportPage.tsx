import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getMyOnboardingRecords } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
  TableCellsIcon, 
  PresentationChartLineIcon, 
  DocumentIcon 
} from '../components/Icons';

interface OnboardingRecord {
  id: string;
  accountName: string;
  picName: string;
  picPhone: string;
  createdAt: string;
  expectedGoLiveDate: string;
  status: string;
  onboardingTypes: string[];
  deliveryConfirmed: boolean;
  deliveryConfirmedDate?: string;
  installationConfirmed: boolean;
  installationConfirmedDate?: string;
  trainingConfirmed: boolean;
  trainingConfirmedDate?: string;
  productSetupConfirmed: boolean;
  productSetupConfirmedDate?: string;
}

const ReportPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const fetchedRecords = await getMyOnboardingRecords();
        setRecords(fetchedRecords);
      } catch (error) {
        toast.error('Failed to fetch onboarding records.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const calculateAgingDays = (record: OnboardingRecord) => {
    const today = new Date();
    const createdAt = new Date(record.createdAt);
    
    // Get required services based on onboarding types
    const requiredServices = [];
    if (record.onboardingTypes?.includes('hardware_delivery')) {
      requiredServices.push({
        confirmed: record.deliveryConfirmed,
        confirmedDate: record.deliveryConfirmedDate
      });
    }
    if (record.onboardingTypes?.includes('hardware_installation')) {
      requiredServices.push({
        confirmed: record.installationConfirmed,
        confirmedDate: record.installationConfirmedDate
      });
    }
    if (record.onboardingTypes?.includes('remote_training') || record.onboardingTypes?.includes('onsite_training')) {
      requiredServices.push({
        confirmed: record.trainingConfirmed,
        confirmedDate: record.trainingConfirmedDate
      });
    }
    if (record.onboardingTypes?.includes('product_setup')) {
      requiredServices.push({
        confirmed: record.productSetupConfirmed,
        confirmedDate: record.productSetupConfirmedDate
      });
    }

    // If no required services, return 0 aging days
    if (requiredServices.length === 0) {
      return 0;
    }

    // Check if all required services are confirmed
    const allConfirmed = requiredServices.every(service => service.confirmed);
    if (allConfirmed) {
      return 0;
    }

    // Find the latest confirmation date among confirmed services
    const confirmedServices = requiredServices.filter(service => service.confirmed && service.confirmedDate);
    
    let referenceDate = createdAt;
    if (confirmedServices.length > 0) {
      // Use the latest confirmation date
      const latestConfirmationDate = confirmedServices
        .map(service => new Date(service.confirmedDate!))
        .reduce((latest, current) => current > latest ? current : latest);
      referenceDate = latestConfirmationDate;
    }

    // Calculate aging days
    const diffTime = today.getTime() - referenceDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const formatServiceStatus = (
    isConfirmed: boolean,
    onboardingTypes?: string[],
    requiredType?: string | string[]
  ) => {
    // Check if this service is required based on onboarding types
    const isRequired = () => {
      if (!onboardingTypes || !requiredType) return true;
      
      if (Array.isArray(requiredType)) {
        return requiredType.some(type => onboardingTypes.includes(type));
      } else {
        return onboardingTypes.includes(requiredType);
      }
    };

    if (!isRequired()) {
      return 'Not Required';
    }

    return isConfirmed ? 'Confirmed' : 'Pending';
  };

  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records;

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Apply date filter
    if (startDate) {
      filtered = filtered.filter(record => new Date(record.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(record => new Date(record.createdAt) <= new Date(endDate));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof OnboardingRecord];
      let bValue: any = b[sortField as keyof OnboardingRecord];

      // Special handling for aging days
      if (sortField === 'agingDays') {
        aValue = calculateAgingDays(a);
        bValue = calculateAgingDays(b);
      }

      // Handle dates
      if (sortField === 'createdAt' || sortField === 'expectedGoLiveDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [records, statusFilter, startDate, endDate, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Account Name',
      'PIC Name',
      'PIC Phone',
      'Created',
      'Go Live',
      'Status',
      'Aging Days',
      'Delivery',
      'Installation',
      'Training',
      'Setup'
    ];

    const csvData = filteredAndSortedRecords.map(record => [
      record.accountName || '',
      record.picName || '',
      record.picPhone || '',
      new Date(record.createdAt).toLocaleDateString(),
      new Date(record.expectedGoLiveDate).toLocaleDateString(),
      record.status || '',
      calculateAgingDays(record).toString(),
      formatServiceStatus(record.deliveryConfirmed, record.onboardingTypes, 'hardware_delivery'),
      formatServiceStatus(record.installationConfirmed, record.onboardingTypes, 'hardware_installation'),
      formatServiceStatus(record.trainingConfirmed, record.onboardingTypes, ['remote_training', 'onsite_training']),
      formatServiceStatus(record.productSetupConfirmed, record.onboardingTypes, 'product_setup')
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `onboarding-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV file downloaded successfully!');
  };

  const exportToExcel = () => {
    // Note: For a full Excel implementation, you'd typically use a library like xlsx
    // For now, we'll export as CSV with .xls extension (Excel can open CSV files)
    const headers = [
      'Account Name',
      'PIC Name',
      'PIC Phone',
      'Created',
      'Go Live',
      'Status',
      'Aging Days',
      'Delivery',
      'Installation',
      'Training',
      'Setup'
    ];

    const csvData = filteredAndSortedRecords.map(record => [
      record.accountName || '',
      record.picName || '',
      record.picPhone || '',
      new Date(record.createdAt).toLocaleDateString(),
      new Date(record.expectedGoLiveDate).toLocaleDateString(),
      record.status || '',
      calculateAgingDays(record).toString(),
      formatServiceStatus(record.deliveryConfirmed, record.onboardingTypes, 'hardware_delivery'),
      formatServiceStatus(record.installationConfirmed, record.onboardingTypes, 'hardware_installation'),
      formatServiceStatus(record.trainingConfirmed, record.onboardingTypes, ['remote_training', 'onsite_training']),
      formatServiceStatus(record.productSetupConfirmed, record.onboardingTypes, 'product_setup')
    ]);

    const csvContent = [
      headers.join('\t'),
      ...csvData.map(row => row.join('\t'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `onboarding-report-${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel file downloaded successfully!');
  };

  const exportToPDF = () => {
    // For a full PDF implementation, you'd typically use a library like jsPDF
    // For now, we'll create a printable HTML page
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export PDF');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Onboarding Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .report-info { margin-bottom: 20px; }
          @media print { 
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Onboarding Report</h1>
        <div class="report-info">
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Generated by:</strong> ${user?.fullName || 'Onboarding Manager'}</p>
          <p><strong>Total Records:</strong> ${filteredAndSortedRecords.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Account Name</th>
              <th>PIC Name</th>
              <th>PIC Phone</th>
              <th>Created</th>
              <th>Go Live</th>
              <th>Status</th>
              <th>Aging Days</th>
              <th>Delivery</th>
              <th>Installation</th>
              <th>Training</th>
              <th>Setup</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAndSortedRecords.map(record => `
              <tr>
                <td>${record.accountName || ''}</td>
                <td>${record.picName || ''}</td>
                <td>${record.picPhone || ''}</td>
                <td>${new Date(record.createdAt).toLocaleDateString()}</td>
                <td>${new Date(record.expectedGoLiveDate).toLocaleDateString()}</td>
                <td>${record.status || ''}</td>
                <td>${calculateAgingDays(record)}</td>
                <td>${formatServiceStatus(record.deliveryConfirmed, record.onboardingTypes, 'hardware_delivery')}</td>
                <td>${formatServiceStatus(record.installationConfirmed, record.onboardingTypes, 'hardware_installation')}</td>
                <td>${formatServiceStatus(record.trainingConfirmed, record.onboardingTypes, ['remote_training', 'onsite_training'])}</td>
                <td>${formatServiceStatus(record.productSetupConfirmed, record.onboardingTypes, 'product_setup')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print / Save as PDF</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success('PDF preview opened! Use Print to save as PDF.');
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirection === 'asc' ? <span className="text-blue-600">↑</span> : <span className="text-blue-600">↓</span>;
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      created: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getAgingBadge = (agingDays: number) => {
    if (agingDays === 0) {
      return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completed</span>;
    } else if (agingDays <= 3) {
      return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">{agingDays} {agingDays === 1 ? 'day' : 'days'}</span>;
    } else if (agingDays <= 7) {
      return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">{agingDays} days</span>;
    } else {
      return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">{agingDays} days</span>;
    }
  };

  const getServiceBadge = (status: string) => {
    const styles = {
      'Confirmed': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Not Required': 'bg-gray-100 text-gray-600'
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-main">
              Onboarding Reports
            </h1>
            <p className="text-text-muted mt-2">
              Generate and download comprehensive onboarding reports
            </p>
          </div>
          <div className="flex space-x-4">
            <Link
              to="/dashboard"
              className="btn-secondary"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date Filters */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="created">Created</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Export Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={exportToCSV}
              className="btn-secondary flex items-center gap-2"
              title="Download as CSV"
            >
              <TableCellsIcon size={16} /> CSV
            </button>
            <button
              onClick={exportToExcel}
              className="btn-secondary flex items-center gap-2"
              title="Download as Excel"
            >
              <PresentationChartLineIcon size={16} /> Excel
            </button>
            <button
              onClick={exportToPDF}
              className="btn-secondary flex items-center gap-2"
              title="Export as PDF"
            >
              <DocumentIcon size={16} /> PDF
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredAndSortedRecords.length} of {records.length} records
        </div>
      </div>

      {/* Report Table */}
      <div className="card">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-3 text-text-muted">Loading records...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="table-header">
                    <th 
                      className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('accountName')}
                    >
                      Account Name <SortIcon field="accountName" />
                    </th>
                    <th 
                      className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('picName')}
                    >
                      PIC Name <SortIcon field="picName" />
                    </th>
                    <th 
                      className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('picPhone')}
                    >
                      PIC Phone <SortIcon field="picPhone" />
                    </th>
                    <th 
                      className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('createdAt')}
                    >
                      Created <SortIcon field="createdAt" />
                    </th>
                    <th 
                      className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('expectedGoLiveDate')}
                    >
                      Go Live <SortIcon field="expectedGoLiveDate" />
                    </th>
                    <th 
                      className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      Status <SortIcon field="status" />
                    </th>
                    <th 
                      className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('agingDays')}
                    >
                      Aging Days <SortIcon field="agingDays" />
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Delivery</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Installation</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Training</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Setup</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-divider">
                  {filteredAndSortedRecords.map((record) => (
                    <tr key={record.id} className="table-row">
                      <td className="py-4 px-4">
                        <div className="font-medium text-text-main">{record.accountName || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-text-main font-medium">{record.picName}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-text-main">{record.picPhone}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-text-muted text-sm">
                          {new Date(record.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-text-main text-sm">
                          {new Date(record.expectedGoLiveDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="py-4 px-4">
                        {getAgingBadge(calculateAgingDays(record))}
                      </td>
                      <td className="py-4 px-4">
                        {getServiceBadge(formatServiceStatus(record.deliveryConfirmed, record.onboardingTypes, 'hardware_delivery'))}
                      </td>
                      <td className="py-4 px-4">
                        {getServiceBadge(formatServiceStatus(record.installationConfirmed, record.onboardingTypes, 'hardware_installation'))}
                      </td>
                      <td className="py-4 px-4">
                        {getServiceBadge(formatServiceStatus(record.trainingConfirmed, record.onboardingTypes, ['remote_training', 'onsite_training']))}
                      </td>
                      <td className="py-4 px-4">
                        {getServiceBadge(formatServiceStatus(record.productSetupConfirmed, record.onboardingTypes, 'product_setup'))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPage; 