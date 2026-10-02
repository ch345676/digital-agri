import type { SoilSample } from './agronomy'
import type { SampleRecord } from './workflow-model'

export function sampleFromRecord(base: SoilSample, record?: SampleRecord): SoilSample {
  if (!record) return base
  const [temperature,soilMoisture,ec,ph,nitrogen,phosphorus,potassium,organic] = record.values
  return { ...base, temperature,soilMoisture,ec,ph,nitrogen,phosphorus,potassium,organic, sampled: record.at.replace('T',' ') }
}
