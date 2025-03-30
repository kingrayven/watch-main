import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";
import { Skeleton } from "../ui/skeleton";
import { RefreshCw } from "lucide-react";
import { Order, OrderStatus } from "../../types/order";

interface Column {
  id: OrderStatus;
  title: string;
  color: string;
}

interface KanbanBoardProps {
  orders: Order[];
  onOrderMove: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onOrderClick: (order: Order) => void;
  isLoading?: boolean;
  isUpdating?: boolean;
}

const statusColumns: Column[] = [
  { id: "pending", title: "Pending", color: "bg-yellow-500" },
  { id: "processing", title: "Processing", color: "bg-blue-500" },
  { id: "shipped", title: "Shipped", color: "bg-purple-500" },
  { id: "delivered", title: "Delivered", color: "bg-green-500" },
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  orders = [],
  onOrderMove = async () => {},
  onOrderClick = () => {},
  isLoading = false,
  isUpdating = false,
}) => {
  const getColumnsWithOrders = () => {
    return statusColumns.map(column => ({
      ...column,
      orders: orders.filter(order => order.status === column.id),
    }));
  };

  const [boardColumns, setBoardColumns] = React.useState(getColumnsWithOrders());
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    setBoardColumns(getColumnsWithOrders());
  }, [orders]);

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as OrderStatus;
    const orderId = draggableId;

    const originalColumns = boardColumns;
    try {
      setBoardColumns(prevColumns => {
        return prevColumns.map(col => {
          if (col.id === source.droppableId) {
            const newOrders = [...col.orders];
            newOrders.splice(source.index, 1);
            return { ...col, orders: newOrders };
          }
          if (col.id === destination.droppableId) {
            const movedOrder = originalColumns.find(c => c.id === source.droppableId)?.orders[source.index];
            if (!movedOrder) return col;
            
            const newOrders = [...col.orders];
            newOrders.splice(destination.index, 0, {
              ...movedOrder,
              status: newStatus
            });
            return { ...col, orders: newOrders };
          }
          return col;
        });
      });

      await onOrderMove(orderId, newStatus);
    } catch (error) {
      setBoardColumns(originalColumns);
      console.error("Failed to update order status:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background p-4 h-full w-full">
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-180px)]">
          {statusColumns.map((column) => (
            <div key={column.id} className="flex flex-col h-full">
              <div className={cn("px-4 py-2 rounded-t-lg", column.color)}>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 rounded-b-lg bg-muted/30 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-8" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background p-4 h-full w-full relative">
      {isUpdating && (
        <div className="absolute inset-0 bg-background/50 z-50 flex items-center justify-center">
          <div className="bg-background p-4 rounded-lg shadow-xl flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Updating order status...</span>
          </div>
        </div>
      )}

      <DragDropContext 
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-180px)]">
          {boardColumns.map((column) => (
            <div key={column.id} className="flex flex-col h-full">
              <div className={cn("px-4 py-2 rounded-t-lg font-medium text-white", column.color)}>
                <div className="flex justify-between items-center">
                  <h2>{column.title}</h2>
                  <span className="bg-white bg-opacity-20 text-white px-2 py-1 rounded-full text-xs">
                    {column.orders.length}
                  </span>
                </div>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "flex-1 overflow-y-auto p-2 rounded-b-lg transition-colors",
                      snapshot.isDraggingOver ? "bg-accent" : "bg-muted/30",
                      isUpdating ? "opacity-70" : ""
                    )}
                  >
                    {column.orders.map((order, index) => (
                      <Draggable
                        key={order.order_id}
                        draggableId={order.order_id}
                        index={index}
                        isDragDisabled={isUpdating}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-3"
                            onClick={() => !isUpdating && onOrderClick(order)}
                          >
                            <Card
                              className={cn(
                                "cursor-pointer hover:shadow-md transition-shadow",
                                snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : "",
                                isUpdating ? "opacity-50" : ""
                              )}
                            >
                              <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-medium flex justify-between">
                                  <span>Order #{order.order_number}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {new Date(order.order_date).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <div className="text-sm mb-2">
                                  {order.customer_name}
                                </div>
                                <div className="text-xs text-muted-foreground mb-2 truncate">
                                  {order.items.length} items · ₱{order.total_amount.toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {order.customer_address}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;