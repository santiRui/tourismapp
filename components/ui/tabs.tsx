"use client"

import * as React from "react"

export interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}

export interface TabsListProps {
  className?: string
  children: React.ReactNode
}

export interface TabsTriggerProps {
  value: string
  children: React.ReactNode
}

export interface TabsContentProps {
  value: string
  children: React.ReactNode
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: "",
  onValueChange: () => {},
})

export function Tabs({ value, onValueChange, className, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: TabsListProps) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext)
  const isSelected = selectedValue === value

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isSelected ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children }: TabsContentProps) {
  const { value: selectedValue } = React.useContext(TabsContext)

  if (selectedValue !== value) return null

  return (
    <div className="mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2">
      {children}
    </div>
  )
}
