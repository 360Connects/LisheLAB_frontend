import { useCountUp } from '../../hooks'
import type { HomeStat } from '../../homeContent'

type Props = {
  stat: HomeStat
  /** Count-up only starts once the surrounding section is on screen. */
  play: boolean
}

/** A single figure that eases up to its value the first time it is seen. */
export function StatFigure({ stat, play }: Props) {
  const value = useCountUp(stat.value, play)
  return (
    <>
      {value}
      {stat.suffix}
    </>
  )
}
