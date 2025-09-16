import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface ProcessingTimeMatrixProps {
  processingTimes: number[][]
}

export function ProcessingTimeMatrix({ processingTimes }: ProcessingTimeMatrixProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Matriks Waktu Pemrosesan
        </CardTitle>
        <CardDescription>Waktu pemrosesan setiap pekerjaan pada setiap mesin</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-11 gap-1 text-xs">
            <div className="font-medium text-center">Job</div>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="font-medium text-center text-muted-foreground">
                M{i + 1}
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {processingTimes.map((row, jobIndex) => (
            <div key={jobIndex} className="grid grid-cols-11 gap-1">
              <div className="flex items-center justify-center">
                <Badge variant="outline" className="text-xs">
                  {jobIndex + 1}
                </Badge>
              </div>
              {row.map((time, machineIndex) => (
                <div
                  key={machineIndex}
                  className={`
                    text-center text-xs p-1 rounded
                    ${
                      time === 1
                        ? "bg-muted text-muted-foreground"
                        : time === 2
                          ? "bg-chart-3/20 text-chart-3"
                          : "bg-chart-4/20 text-chart-4"
                    }
                  `}
                >
                  {time}
                </div>
              ))}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-4 pt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted rounded"></div>
              <span className="text-muted-foreground">1 unit</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-chart-3/20 rounded"></div>
              <span className="text-muted-foreground">2 unit</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-chart-4/20 rounded"></div>
              <span className="text-muted-foreground">3+ unit</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
