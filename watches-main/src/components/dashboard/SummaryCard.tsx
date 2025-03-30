import React from "react";
import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon, DollarSign } from "lucide-react";
import "./dash.css";

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactElement;
  trend?: TrendData;
  className?: string;
  valueClassName?: string;
  titleClassName?: string;
  iconContainerClassName?: string;
  trendClassName?: string;
  isCurrency?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

const SummaryCard = ({
  title = "Summary",
  value = "0",
  icon = <TrendingUpIcon className="h-6 w-6 text-muted-foreground" />,
  trend,
  className,
  valueClassName,
  titleClassName,
  iconContainerClassName,
  trendClassName,
  isCurrency = false,
  isLoading = false,
  error = null,
}: SummaryCardProps) => {
  const formattedValue = isCurrency && typeof value === 'number' 
    ? `₱${value.toLocaleString()}` 
    : value;

  const renderIcon = () => {
    if (title === "Total Revenue") {
      return <DollarSign className="h-6 w-6 text-muted-foreground" />;
    }
    return icon;
  };

  if (isLoading) {
    return (
      <Card 
        className={cn(
          "group overflow-hidden border border-border bg-background shadow-sm",
          className
        )}
        data-testid="summary-card-loading"
      >
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className={cn(
                "rounded-lg bg-gray-200 p-3 text-primary",
                iconContainerClassName
              )}>
                <div className="h-6 w-6 bg-gray-300 rounded" />
              </div>
              {trend && (
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
              )}
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-8 w-32 bg-gray-300 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card 
        className={cn(
          "group overflow-hidden border border-red-500 bg-background shadow-sm",
          className
        )}
        data-testid="summary-card-error"
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div 
              className={cn(
                "rounded-lg bg-red-100 p-3 text-red-500",
                iconContainerClassName
              )}
            >
              {React.cloneElement(renderIcon(), { 
                className: cn("h-6 w-6", renderIcon().props.className),
                "aria-hidden": true 
              })}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={cn(
              "text-sm font-medium text-red-500",
              titleClassName
            )}>
              {title}
            </h3>
            <p className={cn(
              "mt-1 text-sm text-red-500",
              valueClassName
            )}>
              Error loading data
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "group overflow-hidden border border-border bg-background shadow-sm transition-all hover:shadow-md",
        "hover:border-primary/50",
        className
      )}
      data-testid="summary-card"
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div 
            className={cn(
              "rounded-lg bg-primary/10 p-3 text-primary transition-all group-hover:bg-primary/20",
              iconContainerClassName
            )}
            aria-label={title}
          >
            {React.cloneElement(renderIcon(), { 
              className: cn("h-6 w-6", renderIcon().props.className),
              "aria-hidden": true 
            })}
          </div>

          {trend && (
            <div
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                trend.isPositive 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                trendClassName
              )}
              aria-label={`${trend.value}% ${trend.isPositive ? "increase" : "decrease"}`}
            >
              {trend.isPositive ? (
                <ArrowUpIcon className="mr-1 h-3 w-3" aria-hidden="true" />
              ) : (
                <ArrowDownIcon className="mr-1 h-3 w-3" aria-hidden="true" />
              )}
              {trend.value}%
            </div>
          )}
        </div>

        <div className="mt-4">
          <h3 
            className={cn(
              "text-sm font-medium text-muted-foreground",
              titleClassName
            )}
          >
            {title}
          </h3>
          <p 
            className={cn(
              "mt-1 text-2xl font-semibold",
              valueClassName
            )}
          >
            {formattedValue}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;