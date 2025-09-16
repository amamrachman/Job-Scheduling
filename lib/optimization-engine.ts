interface OptimizationParams {
  jobQuantities: number[]
  crossoverMethod: "pmx" | "ox"
  mutationMethod: "inversion" | "swap"
  mutationRate: number
  maxGenerations: number
  targetMakespan: number
}

interface CDSResult {
  sequence: number[]
  makespan: number
  virtualTime1: number[]
  virtualTime2: number[]
}

interface GAResult {
  bestSequence: number[]
  bestMakespan: number
  bestGeneration: number
  history: GenerationHistory[]
}

interface GenerationHistory {
  generation: number
  sequence: number[]
  makespan: number
  population: PopulationMember[]
}

interface PopulationMember {
  sequence: number[]
  makespan: number
  indices: number[]
}

export class OptimizationEngine {
  private processingTimes: number[][]
  private numJobs: number
  private numMachines: number

  constructor(processingTimes: number[][]) {
    this.processingTimes = processingTimes
    this.numJobs = processingTimes.length
    this.numMachines = processingTimes[0].length
  }

  async optimize(params: OptimizationParams) {
    // Expand jobs based on quantities
    const { expandedJobs, expandedIndices } = this.expandJobs(params.jobQuantities)

    if (expandedIndices.length === 0) {
      throw new Error("Tidak ada pesanan yang diproses")
    }

    // Run CDS algorithm
    const cdsResults = this.runCDS(expandedIndices)

    // Run Genetic Algorithm
    const gaResults = await this.runGA(expandedIndices, cdsResults, params)

    return {
      cds: cdsResults,
      ga: gaResults,
      processingMatrix: this.processingTimes,
    }
  }

  private expandJobs(jobQuantities: number[]) {
    const expandedIndices: number[] = []
    const expandedJobs: number[] = []

    for (let i = 0; i < jobQuantities.length; i++) {
      for (let j = 0; j < jobQuantities[i]; j++) {
        expandedIndices.push(i)
        expandedJobs.push(1)
      }
    }

    return { expandedJobs, expandedIndices }
  }

  private runCDS(expandedIndices: number[]): Record<number, CDSResult> {
    const results: Record<number, CDSResult> = {}

    for (let k = 1; k < this.numMachines; k++) {
      const expandedProcessingTimes = expandedIndices.map((idx) => this.processingTimes[idx])
      const { virtualTime1, virtualTime2 } = this.calculateVirtualTimes(expandedProcessingTimes, k)
      const sequence = this.johnsonRule(virtualTime1, virtualTime2)

      const actualSequence = sequence.map((j) => expandedIndices[j])
      const makespan = this.calculateMakespan(actualSequence)
      const displaySequence = actualSequence.map((job) => job + 1)

      results[k] = {
        sequence: displaySequence,
        makespan,
        virtualTime1,
        virtualTime2,
      }
    }

    return results
  }

  private calculateVirtualTimes(processingTimes: number[][], k: number) {
    const numJobs = processingTimes.length
    const virtualTime1 = new Array(numJobs)
    const virtualTime2 = new Array(numJobs)

    for (let i = 0; i < numJobs; i++) {
      virtualTime1[i] = processingTimes[i].slice(0, k).reduce((sum, time) => sum + time, 0)
      virtualTime2[i] = processingTimes[i].slice(-k).reduce((sum, time) => sum + time, 0)
    }

    return { virtualTime1, virtualTime2 }
  }

  private johnsonRule(virtualTime1: number[], virtualTime2: number[]): number[] {
    const n = virtualTime1.length
    const jobs = Array.from({ length: n }, (_, i) => i)
    const left: number[] = []
    const right: number[] = []
    const zeroJobs: number[] = []

    // Handle zero-time jobs
    for (const job of [...jobs]) {
      if (virtualTime1[job] === 0 && virtualTime2[job] === 0) {
        zeroJobs.push(job)
        jobs.splice(jobs.indexOf(job), 1)
      }
    }

    // Apply Johnson's rule
    while (jobs.length > 0) {
      let minTime = Number.POSITIVE_INFINITY
      let minJob = -1
      let minMachine = -1

      for (const job of jobs) {
        if (virtualTime1[job] < minTime) {
          minTime = virtualTime1[job]
          minJob = job
          minMachine = 1
        }
        if (virtualTime2[job] < minTime) {
          minTime = virtualTime2[job]
          minJob = job
          minMachine = 2
        }
      }

      if (minMachine === 1) {
        left.push(minJob)
      } else {
        right.push(minJob)
      }

      jobs.splice(jobs.indexOf(minJob), 1)
    }

    return [...zeroJobs, ...left, ...right.reverse()]
  }

  private calculateMakespan(sequence: number[]): number {
    if (sequence.length === 0) return 0

    const completionTimes = Array(sequence.length)
      .fill(0)
      .map(() => Array(this.numMachines).fill(0))

    // First job
    completionTimes[0][0] = this.processingTimes[sequence[0]][0]
    for (let j = 1; j < this.numMachines; j++) {
      completionTimes[0][j] = completionTimes[0][j - 1] + this.processingTimes[sequence[0]][j]
    }

    // Remaining jobs
    for (let i = 1; i < sequence.length; i++) {
      completionTimes[i][0] = completionTimes[i - 1][0] + this.processingTimes[sequence[i]][0]
      for (let j = 1; j < this.numMachines; j++) {
        completionTimes[i][j] =
          Math.max(completionTimes[i - 1][j], completionTimes[i][j - 1]) + this.processingTimes[sequence[i]][j]
      }
    }

    return completionTimes[sequence.length - 1][this.numMachines - 1]
  }

  private async runGA(
    expandedIndices: number[],
    cdsResults: Record<number, CDSResult>,
    params: OptimizationParams,
  ): Promise<GAResult> {
    if (expandedIndices.length < 2) {
      throw new Error("Tidak cukup job untuk algoritma genetika (kurang dari 2 job)")
    }

    // Get best CDS results as initial parents
    const sortedResults = Object.entries(cdsResults).sort(([, a], [, b]) => a.makespan - b.makespan)

    const parent1Indices = this.getJobIndices(sortedResults[0][1].sequence, expandedIndices)
    const parent2Indices = this.getJobIndices(sortedResults[1][1].sequence, expandedIndices)

    let generation = 1
    let bestMakespan = Number.POSITIVE_INFINITY
    let bestSequence: number[] = []
    let bestGeneration = 0
    const history: GenerationHistory[] = []

    let currentParent1 = parent1Indices
    let currentParent2 = parent2Indices

    while (bestMakespan > params.targetMakespan && generation <= params.maxGenerations) {
      const population = this.createNewGeneration(currentParent1, currentParent2, expandedIndices, params)

      const currentBest = Object.values(population).reduce((best, current) =>
        current.makespan < best.makespan ? current : best,
      )

      if (currentBest.makespan < bestMakespan) {
        bestMakespan = currentBest.makespan
        bestSequence = currentBest.sequence
        bestGeneration = generation
      }

      history.push({
        generation,
        sequence: bestSequence.length > 0 ? bestSequence : currentBest.sequence,
        makespan: bestSequence.length > 0 ? bestMakespan : currentBest.makespan,
        population: Object.values(population),
      })

      // Select best parents for next generation
      const sortedPopulation = Object.values(population).sort((a, b) => a.makespan - b.makespan)
      currentParent1 = sortedPopulation[0].indices
      currentParent2 = sortedPopulation[1].indices

      generation++
    }

    return {
      bestSequence,
      bestMakespan,
      bestGeneration,
      history,
    }
  }

  private getJobIndices(sequence: number[], expandedIndices: number[]): number[] {
    const indices: number[] = []
    const sequenceZeroBased = sequence.map((job) => job - 1)

    for (const job of sequenceZeroBased) {
      const availableIndices = expandedIndices
        .map((expandedJob, index) => ({ expandedJob, index }))
        .filter(({ expandedJob }) => expandedJob === job)
        .map(({ index }) => index)
        .filter((index) => !indices.includes(index))

      if (availableIndices.length > 0) {
        indices.push(availableIndices[0])
      }
    }

    // Fill remaining indices if needed
    if (indices.length !== expandedIndices.length) {
      for (let i = 0; i < expandedIndices.length; i++) {
        if (!indices.includes(i)) {
          indices.push(i)
        }
      }
    }

    return indices
  }

  private createNewGeneration(
    parent1: number[],
    parent2: number[],
    expandedIndices: number[],
    params: OptimizationParams,
  ): Record<number, PopulationMember> {
    const ga = new GeneticAlgorithm(params.crossoverMethod, params.mutationMethod, params.mutationRate)

    const [offspring1, offspring2] = ga.crossover(parent1, parent2)
    const mutated1 = ga.mutate(offspring1)
    const mutated2 = ga.mutate(offspring2)

    const createMember = (indices: number[]): PopulationMember => {
      const sequence = indices.map((idx) => expandedIndices[idx] + 1)
      const actualSequence = indices.map((idx) => expandedIndices[idx])
      const makespan = this.calculateMakespan(actualSequence)
      return { sequence, makespan, indices }
    }

    const bestParent =
      this.calculateMakespan(parent1.map((idx) => expandedIndices[idx])) <=
      this.calculateMakespan(parent2.map((idx) => expandedIndices[idx]))
        ? parent1
        : parent2

    return {
      1: createMember(bestParent),
      2: createMember(offspring1),
      3: createMember(offspring2),
      4: createMember(mutated1),
      5: createMember(mutated2),
    }
  }
}

class GeneticAlgorithm {
  constructor(
    private crossoverMethod: "pmx" | "ox",
    private mutationMethod: "inversion" | "swap",
    private mutationRate: number,
  ) {}

  crossover(parent1: number[], parent2: number[]): [number[], number[]] {
    if (this.crossoverMethod === "pmx") {
      return this.pmxCrossover(parent1, parent2)
    } else {
      return this.oxCrossover(parent1, parent2)
    }
  }

  private pmxCrossover(parent1: number[], parent2: number[]): [number[], number[]] {
    const size = parent1.length

    if (size <= 4) {
      if (size <= 1) return [[...parent1], [...parent2]]
      const cutPoint = Math.floor(size / 2)
      return [
        [...parent1.slice(0, cutPoint), ...parent2.slice(cutPoint)],
        [...parent2.slice(0, cutPoint), ...parent1.slice(cutPoint)],
      ]
    }

    const cutPoint1 = 1
    const cutPoint2 = 3

    const offspring1 = [...parent1]
    const offspring2 = [...parent2]

    const mapping1: Record<number, number> = {}
    const mapping2: Record<number, number> = {}

    // Create mapping and swap middle section
    for (let i = cutPoint1; i < cutPoint2; i++) {
      const val1 = parent1[i]
      const val2 = parent2[i]
      offspring1[i] = val2
      offspring2[i] = val1
      mapping1[val2] = val1
      mapping2[val1] = val2
    }

    // Fix conflicts outside middle section
    const fixConflicts = (offspring: number[], mapping: Record<number, number>) => {
      for (let i = 0; i < size; i++) {
        if (i >= cutPoint1 && i < cutPoint2) continue

        let current = offspring[i]
        while (mapping[current] !== undefined) {
          current = mapping[current]
        }
        offspring[i] = current
      }
    }

    fixConflicts(offspring1, mapping1)
    fixConflicts(offspring2, mapping2)

    return [offspring1, offspring2]
  }

  private oxCrossover(parent1: number[], parent2: number[]): [number[], number[]] {
    const size = parent1.length

    if (size <= 2) return [[...parent1], [...parent2]]

    const cutPoint1 = 1
    const cutPoint2 = Math.max(1, Math.floor(size / 2))

    const offspring1 = new Array(size).fill(null)
    const offspring2 = new Array(size).fill(null)

    // Copy middle sections
    for (let i = cutPoint1; i < cutPoint2; i++) {
      offspring1[i] = parent1[i]
      offspring2[i] = parent2[i]
    }

    // Fill remaining positions
    this.fillOffspring(offspring1, parent2, cutPoint2)
    this.fillOffspring(offspring2, parent1, cutPoint2)

    return [offspring1, offspring2]
  }

  private fillOffspring(offspring: (number | null)[], source: number[], startPos: number) {
    let fillPos = startPos
    let sourcePos = startPos

    while (offspring.includes(null)) {
      if (fillPos >= offspring.length) fillPos = 0
      if (sourcePos >= source.length) sourcePos = 0

      const element = source[sourcePos]

      if (!offspring.includes(element)) {
        while (offspring[fillPos] !== null) {
          fillPos = (fillPos + 1) % offspring.length
        }
        offspring[fillPos] = element
        fillPos = (fillPos + 1) % offspring.length
      }

      sourcePos++

      if (sourcePos > source.length * 2) break // Safety break
    }

    // Fill any remaining nulls
    for (let i = 0; i < offspring.length; i++) {
      if (offspring[i] === null) {
        for (const element of source) {
          if (!offspring.includes(element)) {
            offspring[i] = element
            break
          }
        }
      }
    }
  }

  mutate(sequence: number[]): number[] {
    if (this.mutationMethod === "inversion") {
      return this.inversionMutation(sequence)
    } else {
      return this.swapMutation(sequence)
    }
  }

  private inversionMutation(sequence: number[]): number[] {
    const mutated = [...sequence]

    if (sequence.length < 2) return mutated

    if (Math.random() <= this.mutationRate) {
      const cutPoint1 = 1
      const cutPoint2 = 3

      if (cutPoint1 < cutPoint2 && cutPoint2 <= sequence.length) {
        const segment = mutated.slice(cutPoint1, cutPoint2)
        const reversed = segment.reverse()
        mutated.splice(cutPoint1, cutPoint2 - cutPoint1, ...reversed)
      }
    }

    return mutated
  }

  private swapMutation(sequence: number[]): number[] {
    const mutated = [...sequence]

    if (sequence.length < 2) return mutated

    if (Math.random() <= this.mutationRate) {
      const index1 = 1
      const index2 = Math.min(3, sequence.length - 1)

      if (index1 < sequence.length && index2 < sequence.length) {
        ;[mutated[index1], mutated[index2]] = [mutated[index2], mutated[index1]]
      }
    }

    return mutated
  }
}
