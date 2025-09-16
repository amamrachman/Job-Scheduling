import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BarChart3, Zap, Target, TrendingUp } from "lucide-react"

interface OptimizationResultsProps {
  results: any
}

export function OptimizationResults({ results }: OptimizationResultsProps) {
  const { cds, ga } = results

  // Get best CDS result
  const cdsEntries = Object.entries(cds).filter(([key]) => key !== "ga")
  const bestCDS = cdsEntries.reduce((best, [key, result]: [string, any]) =>
    result.makespan < best.makespan ? result : best,
  )

  // Sort CDS results by makespan
  const sortedCDS = cdsEntries
    .map(([key, result]: [string, any]) => ({ iteration: key, ...result }))
    .sort((a, b) => a.makespan - b.makespan)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-1/10 rounded-lg">
                <Target className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Best CDS Makespan</p>
                <p className="text-2xl font-bold">{bestCDS.makespan}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <Zap className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">GA Best Makespan</p>
                <p className="text-2xl font-bold">{ga.bestMakespan}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-3/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Best Generation</p>
                <p className="text-2xl font-bold">{ga.bestGeneration}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Tabs defaultValue="cds" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cds">Hasil CDS</TabsTrigger>
          <TabsTrigger value="ga">Algoritma Genetika</TabsTrigger>
        </TabsList>

        <TabsContent value="cds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Hasil Algoritma CDS
              </CardTitle>
              <CardDescription>Hasil optimasi menggunakan Campbell, Dudek, dan Smith algorithm</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {sortedCDS.map((result, index) => (
                    <div key={result.iteration} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? "default" : "secondary"}>Iterasi {result.iteration}</Badge>
                          {index === 0 && (
                            <Badge variant="outline" className="text-chart-2 border-chart-2">
                              Terbaik
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Makespan</p>
                          <p className="text-lg font-semibold">{result.makespan}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Urutan:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.sequence.map((job: number, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {job}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ga" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Hasil Algoritma Genetika
              </CardTitle>
              <CardDescription>Evolusi populasi melalui crossover dan mutasi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Best Result Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-3">Solusi Terbaik</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Generasi Terbaik</p>
                      <p className="text-lg font-semibold">{ga.bestGeneration}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Makespan Terbaik</p>
                      <p className="text-lg font-semibold">{ga.bestMakespan}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Urutan Terbaik:</p>
                    <div className="flex flex-wrap gap-1">
                      {ga.bestSequence.map((job: number, idx: number) => (
                        <Badge key={idx} variant="default" className="text-xs">
                          {job}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generation History */}
                <div>
                  <h4 className="font-semibold mb-4">Perkembangan Generasi</h4>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {ga.history.map((gen: any) => (
                        <div key={gen.generation} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline">Generasi {gen.generation}</Badge>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Makespan</p>
                              <p className="font-semibold">{gen.makespan}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium mb-2">Urutan Terbaik:</p>
                              <div className="flex flex-wrap gap-1">
                                {gen.sequence.map((job: number, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {job}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <p className="text-sm font-medium mb-2">Populasi:</p>
                              <div className="grid gap-2">
                                {gen.population.map((individual: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        #{idx + 1}
                                      </Badge>
                                      <div className="flex gap-1">
                                        {individual.sequence.slice(0, 5).map((job: number, jobIdx: number) => (
                                          <span key={jobIdx} className="px-1 py-0.5 bg-background rounded">
                                            {job}
                                          </span>
                                        ))}
                                        {individual.sequence.length > 5 && <span>...</span>}
                                      </div>
                                    </div>
                                    <span className="font-medium">{individual.makespan}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
