/** A deliberately schematic section; no generated photographic texture. */
export default function SoilProfileDiagram() {
  return <svg className="soil-profile-photo" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="土层、幼苗根系与养分迁移的矢量示意图，非土壤实测照片">
    <rect width="900" height="600" fill="#dfe9d5"/>
    <path d="M0 216Q130 154 266 205T530 185T900 197V275H0Z" fill="#b5c5a1"/>
    <path d="M0 237Q225 209 450 241T900 231V335H0Z" fill="#7b7256"/>
    <path d="M0 290Q240 323 457 298T900 304V421H0Z" fill="#716346"/>
    <path d="M0 393Q230 368 460 410T900 391V525H0Z" fill="#5b533e"/>
    <path d="M0 492Q210 474 450 516T900 504V600H0Z" fill="#454939"/>
    <g fill="none" stroke="#b6a882" strokeWidth="1" opacity=".4"><path d="M0 295Q240 328 450 303T900 309M0 398Q230 373 460 415T900 396M0 498Q210 479 450 522T900 510"/>
      {Array.from({length:42},(_,i)=><path key={i} d={`M${32+(i*137)%840} ${280+(i*71)%295}l${5+i%6} ${i%2?3:-3}`}/>)}
    </g>
    <g fill="none" strokeLinecap="round"><path d="M450 250Q443 197 450 143" stroke="#53764d" strokeWidth="9"/>
      <path d="M450 228Q447 338 464 423L455 527M450 285Q391 296 374 349L325 404M451 315Q511 318 528 370L578 428M458 378Q406 401 394 464M463 420Q517 452 513 509" stroke="#d7c49a" strokeWidth="5"/>
      <path d="M403 306L371 294M381 331L340 340M359 365L353 405M334 395L300 396M480 323L507 303M519 349L555 343M541 386L540 421M565 414L594 408M433 397L415 430M401 439L369 448M490 445L486 477M511 480L544 493M458 484L431 511" stroke="#c7b187" strokeWidth="2"/>
    </g>
    <path d="M450 191Q355 191 355 126Q438 117 450 191Z" fill="#698b57"/>
    <path d="M449 164Q451 98 523 90Q533 149 449 164Z" fill="#83a267"/>
    <path d="M450 191L377 141M450 164L508 106" stroke="#c3d3a1" strokeWidth="2"/>
    <g fill="#e4d9b8" fontSize="12" fontFamily="sans-serif" opacity=".65"><text x="44" y="275">表土层</text><text x="44" y="368">心土层</text><text x="44" y="463">母质层</text></g>
    <text x="690" y="38" fill="#567451" fontSize="12" fontFamily="sans-serif" letterSpacing="2">SOIL / SCHEMATIC</text>
  </svg>
}
