"use client";

import { useEffect, useState } from 'react';
import PmdSprite, { type PmdAnim } from '@/components/PmdSprite';
import team from '@/data/pmd-team.json';
import { explorerFresh, loadPoints, rankOf, readExplorer } from '@/lib/explorer';
// Styles: app/globals.css (Mystery Dungeon UI cards).

const number = new Intl.NumberFormat('en');
/** The team: Diancie leads, then the workspace tabs' mascots. The team name is left blank on purpose. */
const TEAM = [team.diancie, team.fuecoco, team.froakie, team.teddiursa, team.jirachi] as PmdAnim[];

/** Explorer Rank in Mystery Dungeon's navy UI: the rank badge, all-time contributions as points, progress to the next rank. */
export default function ExplorerRank() {
  const [points, setPoints] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    const cached = readExplorer(); if (cached) setPoints(cached.points);
    if (!explorerFresh(readExplorer())) loadPoints().then(p => { if (live) setPoints(p); }, () => { /* keep the cached rank */ });
    return () => { live = false; };
  }, []);
  const rank = rankOf(points ?? 0);
  const toGo = rank.next && rank.needed !== null ? `${number.format(rank.needed - (points ?? 0))} to ${rank.next} Rank` : 'Top rank reached';
  return <div className="pmd-card pmd-rank" data-state={points === null ? 'loading' : 'ready'}>
    <img className="pmd-badge" src={`/pmd/ranks/${rank.badge}.png`} alt="" width={64} height={64} />
    <div className="pmd-rank-info">
      <p className="pmd-label">Explorer Rank</p>
      <p className="pmd-rank-name">{points === null ? '…' : `${rank.name} Rank`}</p>
      <p className="pmd-note"><span className="pmd-number">{points === null ? '—' : number.format(points)}</span> points · all-time contributions</p>
      <div className="pmd-bar" role="progressbar" aria-label={`Progress to ${rank.next ?? 'the top'} Rank`}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rank.progress * 100)}>
        <span style={{ width: `${Math.max(2, rank.progress * 100)}%` }} />
      </div>
      <p className="pmd-note pmd-to-go">{points === null ? '' : toGo}</p>
    </div>
    <div className="pmd-team" aria-label="Team: Diancie, Fuecoco, Froakie, Teddiursa and Jirachi">
      <p className="pmd-label">Team <span className="pmd-blank" aria-hidden="true" /></p>
      <div className="pmd-members">{TEAM.map((anim, i) => <PmdSprite key={i} anim={anim} size={26} />)}</div>
    </div>
  </div>;
}
