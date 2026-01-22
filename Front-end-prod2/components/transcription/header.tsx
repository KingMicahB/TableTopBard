"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Mic, Settings, Download, Moon, Sun, Languages } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AudioDevice } from "@/lib/types"
import { LANGUAGES } from "@/lib/transcription-store"

interface HeaderProps {
  audioDevices: AudioDevice[]
  selectedDevice: string
  onDeviceChange: (deviceId: string) => void
  selectedLanguage: string
  onLanguageChange: (language: string) => void
  onSettingsOpen: () => void
  onExportOpen: () => void
}

export function Header({
  audioDevices,
  selectedDevice,
  onDeviceChange,
  selectedLanguage,
  onLanguageChange,
  onSettingsOpen,
  onExportOpen,
}: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden bg-primary">
            <Image 
              src="/logo.png" 
              alt="TableTopBard Logo" 
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">TableTopBard</h1>
            <p className="text-xs text-muted-foreground">Live Captioning</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Input Selector */}
          <Select value={selectedDevice} onValueChange={onDeviceChange}>
            <SelectTrigger 
              className="w-[180px] focus-visible-ring" 
              aria-label="Select audio input device"
            >
              <Mic className="mr-2 h-4 w-4" aria-hidden="true" />
              <SelectValue placeholder="Select microphone" />
            </SelectTrigger>
            <SelectContent>
              {audioDevices.length === 0 ? (
                <SelectItem value="default">Default Microphone</SelectItem>
              ) : (
                audioDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Language Selector */}
          <Select value={selectedLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger 
              className="w-[140px] focus-visible-ring" 
              aria-label="Select transcription language"
            >
              <Languages className="mr-2 h-4 w-4" aria-hidden="true" />
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="focus-visible-ring"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden="true" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden="true" />
            </Button>
          )}

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsOpen}
            className="focus-visible-ring"
            aria-label="Open settings"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </Button>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="focus-visible-ring"
                aria-label="Export transcript"
              >
                <Download className="h-5 w-5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportOpen}>
                Export Transcript
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
