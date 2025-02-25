import React, { useState } from 'react';
import { FinancialDocument } from '@/types/financial';

interface FinancialTableProps {
  document: FinancialDocument;
}

const FinancialTable: React.FC<FinancialTableProps> = ({ document }) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const toggleSection = (index: number) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedSections(newSet);
  };

  const { metadata, data } = document || {};
  const { companyName, reportType, period } = metadata || {};

  return (
    <div className="overflow-auto">
      {metadata && (
        <div className="mb-4">
          <h2 className="text-xl font-bold">{companyName || 'Unknown Company'}</h2>
          <p className="text-md text-gray-600">{reportType || 'Unknown Report Type'}</p>
          <p className="text-md text-gray-600">
            {`Period: ${period?.current || 'N/A'} - ${period?.previous || 'N/A'}`}
          </p>
        </div>
      )}
      <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 border-b border-gray-300 text-left font-semibold text-gray-700">Account</th>
            {data.headers.map((header, index) => (
              <th key={index} className="py-3 px-4 border-b border-gray-300 text-left font-semibold text-gray-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              <tr
                className={`hover:bg-gray-50 cursor-pointer ${expandedSections.has(rowIndex) ? 'bg-gray-50' : ''}`}
                onClick={() => toggleSection(rowIndex)}
              >
                <td className="py-2 px-4 border-b border-gray-200 text-gray-800">{row.label}</td>
                {row.values.map((value, valueIndex) => (
                  <td key={valueIndex} className="py-2 px-4 border-b border-gray-200 text-gray-800">
                    {value}
                  </td>
                ))}
              </tr>
              {expandedSections.has(rowIndex) && (
                <tr>
                  <td colSpan={data.headers.length + 1} className="py-2 px-4 border-b border-gray-200">
                    {/* Additional details or sub-items can be displayed here */}
                    <div className="text-sm text-gray-600">Additional details for {row.label}</div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinancialTable; 