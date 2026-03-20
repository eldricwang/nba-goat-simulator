const p=require('../data/players.json');
const s=require('../data/seasons.json');

console.log('=== 数据摘要 ===');
console.log('总球员数:', p.length);
console.log('总赛季数据:', s.length);
console.log('现役:', p.filter(x=>x.active).length);
console.log('退役:', p.filter(x=>!x.active).length);

const withHeight = p.filter(x=>x.heightCm).length;
const withBirth = p.filter(x=>x.birthDate).length;
const withDraft = p.filter(x=>x.draftYear).length;
const withCountry = p.filter(x=>x.country).length;
console.log('\nProfile覆盖率:');
console.log('  身高:', withHeight, '/', p.length);
console.log('  出生:', withBirth, '/', p.length);
console.log('  选秀:', withDraft, '/', p.length);
console.log('  国籍:', withCountry, '/', p.length);

const pids = new Set(s.map(x=>x.playerId));
const noSeason = p.filter(x=>!pids.has(x.id)).length;
console.log('\n赛季数据:');
console.log('  有赛季数据:', pids.size);
console.log('  无赛季数据:', noSeason);

const hot = ['lebron-james','stephen-curry','michael-jordan','kobe-bryant','kevin-durant'];
console.log('\n热门球员:');
for(const id of hot) {
  const pl = p.find(x=>x.id===id);
  const ss = s.filter(x=>x.playerId===id);
  if(pl) console.log('  '+id+': ✅ '+ss.length+'赛季 '+pl.career.pts+'P/'+pl.career.reb+'R/'+pl.career.ast+'A h:'+pl.heightCm);
}
