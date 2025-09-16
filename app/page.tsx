"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, Settings, BarChart3, RefreshCw, Play } from "lucide-react"
import { OptimizationEngine } from "@/lib/optimization-engine"
import { OptimizationResults } from "@/components/optimization-results"
import { ProcessingTimeMatrix } from "@/components/processing-time-matrix"

export default function JobSchedulingOptimizer() {
  const [jobQuantities, setJobQuantities] = useState<number[]>([1, 1, 1, 1, 1])
  const [crossoverMethod, setCrossoverMethod] = useState<"pmx" | "ox">("pmx")
  const [mutationMethod, setMutationMethod] = useState<"inversion" | "swap">("inversion")
  const [mutationRate, setMutationRate] = useState<number>(0.5)
  const [maxGenerations, setMaxGenerations] = useState<number>(5)
  const [targetMakespan, setTargetMakespan] = useState<number>(20)
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string>("")

  const processingTimes = [
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 1],
    [1, 1, 2, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 2, 3, 1, 1, 1, 1],
    [1, 1, 1, 2, 3, 3, 3, 2, 1, 1],
    [1, 1, 1, 1, 2, 2, 1, 1, 1, 2],
  ]

  const handleJobQuantityChange = (index: number, value: string) => {
    const newQuantities = [...jobQuantities]
    newQuantities[index] = Number.parseInt(value) || 0
    setJobQuantities(newQuantities)
  }

  const handleOptimize = async () => {
    try {
      setIsOptimizing(true)
      setError("")

      if (jobQuantities.every((q) => q === 0)) {
        setError("Tidak ada pesanan yang diproses")
        return
      }

      if (targetMakespan <= 0) {
        setError("Target makespan harus lebih besar dari 0")
        return
      }

      const engine = new OptimizationEngine(processingTimes)
      const optimizationResults = await engine.optimize({
        jobQuantities,
        crossoverMethod,
        mutationMethod,
        mutationRate,
        maxGenerations,
        targetMakespan,
      })

      setResults(optimizationResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat optimasi")
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleReset = () => {
    setJobQuantities([1, 1, 1, 1, 1])
    setCrossoverMethod("pmx")
    setMutationMethod("inversion")
    setMutationRate(0.5)
    setMaxGenerations(5)
    setTargetMakespan(20)
    setResults(null)
    setError("")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary rounded-lg">
              <Calculator className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-balance">Optimasi Penjadwalan Pekerjaan</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Sistem optimasi menggunakan algoritma CDS dan Genetika untuk mencari jadwal produksi terbaik
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Parameter Input
                </CardTitle>
                <CardDescription>Atur parameter optimasi dan jumlah pesanan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Job Quantities */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Jumlah Pesanan per Pekerjaan</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {jobQuantities.map((quantity, index) => (
                      <div key={index} className="space-y-2">
                        <Label htmlFor={`job-${index}`} className="text-xs text-muted-foreground">
                          Pekerjaan {index + 1}
                        </Label>
                        <Input
                          id={`job-${index}`}
                          type="number"
                          min="0"
                          value={quantity}
                          onChange={(e) => handleJobQuantityChange(index, e.target.value)}
                          className="h-9"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Algorithm Parameters */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Parameter Algoritma Genetika</Label>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="crossover" className="text-xs text-muted-foreground">
                        Crossover
                      </Label>
                      <Select
                        value={crossoverMethod}
                        onValueChange={(value: "pmx" | "ox") => setCrossoverMethod(value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pmx">PMX</SelectItem>
                          <SelectItem value="ox">OX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mutation" className="text-xs text-muted-foreground">
                        Mutasi
                      </Label>
                      <Select
                        value={mutationMethod}
                        onValueChange={(value: "inversion" | "swap") => setMutationMethod(value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inversion">Inversion</SelectItem>
                          <SelectItem value="swap">Swap</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="mutation-rate" className="text-xs text-muted-foreground">
                        Probabilitas Mutasi
                      </Label>
                      <Input
                        id="mutation-rate"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={mutationRate}
                        onChange={(e) => setMutationRate(Number.parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-generations" className="text-xs text-muted-foreground">
                        Max Generasi
                      </Label>
                      <Input
                        id="max-generations"
                        type="number"
                        min="1"
                        value={maxGenerations}
                        onChange={(e) => setMaxGenerations(Number.parseInt(e.target.value) || 1)}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-makespan" className="text-xs text-muted-foreground">
                      Target Makespan
                    </Label>
                    <Input
                      id="target-makespan"
                      type="number"
                      min="1"
                      value={targetMakespan}
                      onChange={(e) => setTargetMakespan(Number.parseInt(e.target.value) || 1)}
                      className="h-9"
                    />
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleOptimize} disabled={isOptimizing} className="flex-1">
                    {isOptimizing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Mengoptimasi...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Jalankan Optimasi
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Processing Time Matrix */}
            <ProcessingTimeMatrix processingTimes={processingTimes} />
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {results ? (
              <OptimizationResults results={results} />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center space-y-4 py-12">
                  <div className="p-4 bg-muted rounded-full w-fit mx-auto">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Siap untuk Optimasi</h3>
                    <p className="text-muted-foreground text-sm">
                      Atur parameter di panel kiri dan klik "Jalankan Optimasi" untuk melihat hasil
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
