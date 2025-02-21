'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Deal {
  id: string;
  companyName: string;
  industry: string;
  location: string;
  revenue: string;
  ebitda: string;
  loanScore: number;
  lastActivity: string;
  documents: string[];
  status: string;
}

interface Column {
  id: string;
  title: string;
  dealIds: string[];
}

const initialDeals: Record<string, Deal> = {
  '1': {
    id: '1',
    companyName: 'Tech Solutions Inc',
    industry: 'Software',
    location: 'Austin, TX',
    revenue: '$5M',
    ebitda: '$1.2M',
    loanScore: 85,
    lastActivity: '2024-01-15',
    documents: ['nda.pdf'],
    status: '🟢 Active',
  },
  '2': {
    id: '2',
    companyName: 'Manufacturing Pro',
    industry: 'Manufacturing',
    location: 'Detroit, MI',
    revenue: '$12M',
    ebitda: '$2.8M',
    loanScore: 92,
    lastActivity: '2024-01-14',
    documents: ['nda.pdf', 'cim.pdf'],
    status: '🟡 Pending',
  },
  // Add more deals...
};

const initialColumns: Record<string, Column> = {
  'prospecting': {
    id: 'prospecting',
    title: 'Prospecting',
    dealIds: ['1', '2'],
  },
  'nda': {
    id: 'nda',
    title: 'NDA Stage',
    dealIds: ['3'],
  },
  'cim': {
    id: 'cim',
    title: 'CIM Review',
    dealIds: ['4'],
  },
  'loi': {
    id: 'loi',
    title: 'LOI/Due Diligence',
    dealIds: [],
  },
  'closed': {
    id: 'closed',
    title: 'Closed',
    dealIds: [],
  },
};

export default function DealFlow() {
  const [columns, setColumns] = useState<Record<string, Column>>(initialColumns);
  const [deals] = useState<Record<string, Deal>>(initialDeals);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If there's no destination, we don't need to do anything
    if (!destination) return;

    // If the item is dropped in the same position, we don't need to do anything
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the source and destination columns
    const startColumn = columns[source.droppableId];
    const endColumn = columns[destination.droppableId];

    // If dropping in the same column
    if (startColumn === endColumn) {
      const newDealIds = Array.from(startColumn.dealIds);
      newDealIds.splice(source.index, 1);
      newDealIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        dealIds: newDealIds,
      };

      setColumns({
        ...columns,
        [newColumn.id]: newColumn,
      });
      return;
    }

    // Moving from one column to another
    const startDealIds = Array.from(startColumn.dealIds);
    startDealIds.splice(source.index, 1);
    const newStart = {
      ...startColumn,
      dealIds: startDealIds,
    };

    const finishDealIds = Array.from(endColumn.dealIds);
    finishDealIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...endColumn,
      dealIds: finishDealIds,
    };

    setColumns({
      ...columns,
      [newStart.id]: newStart,
      [newFinish.id]: newFinish,
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deal Flow</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add New Deal
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.values(columns).map((column) => (
            <div key={column.id} className="w-80 flex-shrink-0">
              <div className="bg-gray-100 rounded-lg p-4">
                <h2 className="font-semibold mb-4">{column.title}</h2>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-3 min-h-[200px]"
                    >
                      {column.dealIds.map((dealId, index) => {
                        const deal = deals[dealId];
                        if (!deal) return null;
                        
                        return (
                          <Draggable key={dealId} draggableId={dealId} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-medium">{deal.companyName}</h3>
                                  <span className="text-sm">{deal.status}</span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>{deal.industry} • {deal.location}</p>
                                  <p>Revenue: {deal.revenue} • EBITDA: {deal.ebitda}</p>
                                  <p className="text-xs text-gray-500">
                                    Last activity: {new Date(deal.lastActivity).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
} 