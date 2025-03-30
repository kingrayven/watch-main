import React, { ReactNode, useState} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DownloadIcon, PrinterIcon, FilterIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface ChartContainerProps {
  title?: string;
  children?: ReactNode;
  className?: string;
  filterOptions?: {
    label: string;
    value: string;
  }[];
  onFilterChange?: (value: string) => void;
  onExport?: (type: "csv" | "pdf" | "print") => void;
}

const ChartContainer = ({
  title = "Analytics Chart",
  children,
  className,
  filterOptions = [],
  onFilterChange,
  onExport,
}: ChartContainerProps) => {
  const [timeframe, setTimeframe] = useState(filterOptions[0]?.value || "");

  const handleFilterChange = (value: string) => {
    setTimeframe(value);
    if (onFilterChange) {
      onFilterChange(value);
    }
  };

  const handleExport = (type: "csv" | "pdf" | "print") => {
    if (onExport) {
      onExport(type);
    }
  };

  return (
    <Card className={cn("w-full bg-[#1E1E1E] border-[#333] rounded-lg shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 border-b border-[#333] px-5 pt-4">
        <CardTitle className="text-lg font-semibold text-gray-100">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {filterOptions.length > 0 && (
            <Select
              value={timeframe}
              onValueChange={handleFilterChange}
            >
              <SelectTrigger className="w-[160px] h-9 bg-[#2A2A2A] border-[#444] text-gray-200 hover:bg-[#333] transition-colors">
                <div className="flex items-center">
                  <FilterIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Filter" className="text-gray-200" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#444] text-gray-200">
                {filterOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="hover:bg-[#333] focus:bg-[#333] transition-colors"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 bg-[#2A2A2A] border border-[#444] text-gray-300 hover:bg-[#333] hover:text-white transition-colors"
              onClick={() => handleExport("csv")}
              title="Download as CSV"
            >
              <DownloadIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 bg-[#2A2A2A] border border-[#444] text-gray-300 hover:bg-[#333] hover:text-white transition-colors"
              onClick={() => handleExport("pdf")}
              title="Download as PDF"
            >
              <DownloadIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 bg-[#2A2A2A] border border-[#444] text-gray-300 hover:bg-[#333] hover:text-white transition-colors"
              onClick={() => handleExport("print")}
              title="Print Report"
            >
              <PrinterIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4 h-[400px]">
        <div className="h-full w-full rounded-md overflow-hidden">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartContainer;