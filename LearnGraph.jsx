import { useState, useRef, useEffect, useCallback } from "react";

const CONCEPTS = [
  { id: "arrays", label: "Arrays & Big-O", x: 80, y: 140, prereqs: [], week: 1, covers: "Indexing, memory layout, time and space complexity analysis.", industry: "Foundation for every coding interview. Tested in 90% of technical screens.", research: "Core to algorithm analysis and computational complexity theory.", interviewQ: "Given an unsorted array, find two numbers that sum to a target in O(n) time.", researchQ: "How does cache-line alignment in arrays affect real-world vs theoretical time complexity?", estTime: "3h", assmt: "Assignment 1, Midterm, Final" },
  { id: "linkedlists", label: "Linked lists", x: 230, y: 60, prereqs: ["arrays"], week: 2, covers: "Nodes, pointers, singly and doubly linked, insertion and deletion.", industry: "Common in system design discussions. Used in LRU caches, memory allocators.", research: "Foundational to persistent data structures and functional programming research.", interviewQ: "Detect if a linked list has a cycle using O(1) space.", researchQ: "How do persistent linked lists enable efficient versioned data structures?", estTime: "3h", assmt: "Assignment 1, Midterm" },
  { id: "recursion", label: "Recursion", x: 230, y: 220, prereqs: ["arrays"], week: 3, covers: "Base cases, recursive calls, the call stack, tracing execution, memoization.", industry: "Tested in almost every technical interview. Key to dynamic programming.", research: "Connects to computability theory, lambda calculus, and formal verification.", interviewQ: "Write a recursive solution for the N-Queens problem. What's the time complexity?", researchQ: "How does structural recursion relate to termination proofs in dependent type theory?", estTime: "4h", assmt: "Assignment 2, Midterm, Final" },
  { id: "stacks", label: "Stacks & queues", x: 400, y: 60, prereqs: ["linkedlists"], week: 4, covers: "LIFO and FIFO, push/pop/enqueue, expression parsing, BFS.", industry: "Used in browser history, undo systems, task schedulers. Common interview topic.", research: "Fundamental to automata theory — pushdown automata use stack-based models.", interviewQ: "Implement a queue using two stacks with amortized O(1) operations.", researchQ: "How do pushdown automata extend finite automata, and what class of languages do they recognize?", estTime: "3h", assmt: "Assignment 2, Midterm" },
  { id: "trees", label: "Trees", x: 400, y: 220, prereqs: ["recursion"], week: 5, covers: "Tree terminology, binary trees, traversals (in/pre/post-order), depth and height.", industry: "Core to databases (B-trees), compilers (ASTs), and frontend (DOM). Very common in interviews.", research: "Central to compiler optimization, computational biology (phylogenetic trees), and data compression.", interviewQ: "Given a binary tree, determine if it is height-balanced in O(n) time.", researchQ: "How are suffix trees used in genomic sequence alignment, and what are their space complexity trade-offs?", estTime: "4h", assmt: "Assignment 2, Midterm, Final" },
  { id: "bst", label: "Search trees", x: 560, y: 60, prereqs: ["stacks", "trees"], week: 6, covers: "BST property, search/insert/delete, balancing concepts, AVL introduction.", industry: "Databases use B-trees and red-black trees. Frequently tested in senior interviews.", research: "Self-balancing trees connect to amortized analysis and competitive analysis research.", interviewQ: "Validate whether a binary tree satisfies the BST property without extra space.", researchQ: "Compare the amortized bounds of splay trees against worst-case balanced trees. When do splay trees win?", estTime: "4h", assmt: "Midterm, Final" },
  { id: "sorting", label: "Sorting", x: 560, y: 220, prereqs: ["recursion", "trees"], week: 7, covers: "Merge sort, quicksort, heapsort, comparison-based lower bound, stability.", industry: "Every engineer must know trade-offs between sorting algorithms. Common system design topic.", research: "Lower bound proofs connect to information theory. External sorting is active research in databases.", interviewQ: "Why is quicksort faster in practice than merge sort despite the same average complexity?", researchQ: "Prove the Ω(n log n) lower bound for comparison-based sorting using decision trees.", estTime: "5h", assmt: "Midterm, Final" },
  { id: "graphs", label: "Graphs", x: 400, y: 360, prereqs: ["trees", "stacks"], week: 9, covers: "Representations, BFS, DFS, connected components, topological sort.", industry: "Social networks, maps, recommendation engines all use graphs. Key for senior roles.", research: "Graph algorithms are central to network science, computational social science, and bioinformatics.", interviewQ: "Find the shortest path in an unweighted graph. How would you modify this for a weighted graph?", researchQ: "How do expander graphs improve randomized algorithm performance?", estTime: "5h", assmt: "Final" },
  { id: "dp", label: "Dynamic programming", x: 560, y: 360, prereqs: ["recursion", "sorting"], week: 10, covers: "Overlapping subproblems, optimal substructure, memoization vs tabulation.", industry: "The most common hard interview topic. Amazon, Google, Meta all test DP heavily.", research: "Connects to optimization theory, control theory, and reinforcement learning foundations.", interviewQ: "Solve the longest common subsequence problem. Optimize from O(mn) space to O(min(m,n)).", researchQ: "How does Bellman's principle of optimality formalize when DP is applicable?", estTime: "6h", assmt: "Final" },
];

const MASTERY = { mastered: { color: "#5DCAA5", bg: "#E1F5EE", label: "Mastered" }, inprogress: { color: "#EF9F27", bg: "#FAEEDA", label: "In progress" }, ready: { color: "#7F77DD", bg: "#EEEDFE", label: "Ready" }, locked: { color: "#B4B2A9", bg: "#F1EFE8", label: "Locked" } };

function getInitialMastery() {
  return { arrays: "mastered", linkedlists: "mastered", recursion: "inprogress", stacks: "ready", trees: "ready", bst: "locked", sorting: "locked", graphs: "locked", dp: "locked" };
}

function Button({ children, primary, small, disabled, onClick, style }) {
  return (
    <button disabled={disabled} onClick={onClick} style={{ border: primary ? "none" : "0.5px solid #ccc", background: primary ? "#1a1a1a" : "transparent", color: primary ? "#fff" : "#1a1a1a", padding: small ? "8px 16px" : "12px 24px", borderRadius: 8, fontSize: small ? 13 : 15, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, transition: "all 0.15s", ...style }} >
      {children}
    </button>
  );
}

function ProgressBar({ value, color = "#5DCAA5" }) {
  return (
    <div style={{ height: 6, background: "#eee", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ─── SCREEN 1: LANDING ─────────────────
function LandingScreen({ onNext }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 520, textAlign: "center", padding: "2rem" }}>
      <div style={{ fontSize: 40, marginBottom: 8, letterSpacing: -1 }}>◈</div>
      <h1 style={{ fontSize: 28, fontWeight: 500, margin: "0 0 8px", letterSpacing: -0.5 }}>LearnGraph</h1>
      <p style={{ fontSize: 16, color: "#666", margin: "0 0 32px", maxWidth: 380, lineHeight: 1.6 }}>Your AI-powered learning companion. Master every concept, not just every assignment.</p>
      <Button primary onClick={onNext}>Get started</Button>
    </div>
  );
}

// ─── SCREEN 2: SIGN UP ─────────────────
function SignUpScreen({ onNext }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  return (
    <div style={{ maxWidth: 360, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>Create your account</h2>
      <p style={{ fontSize: 14, color: "#888", margin: "0 0 28px" }}>Takes about 10 seconds.</p>
      <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 6 }}>Full name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Maya Rodriguez" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid #ccc", fontSize: 15, marginBottom: 16, boxSizing: "border-box" }} />
      <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 6 }}>Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="maya@university.edu" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid #ccc", fontSize: 15, marginBottom: 16, boxSizing: "border-box" }} />
      <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 6 }}>University</label>
      <input placeholder="Stanford University" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid #ccc", fontSize: 15, marginBottom: 24, boxSizing: "border-box" }} />
      <Button primary onClick={onNext} style={{ width: "100%" }}>Create account</Button>
    </div>
  );
}

// ─── SCREEN 3: JOIN COURSE ──────────────
function JoinCourseScreen({ onNext }) {
  const [code, setCode] = useState("");
  return (
    <div style={{ maxWidth: 360, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>Join a course</h2>
      <p style={{ fontSize: 14, color: "#888", margin: "0 0 28px" }}>Enter the code your professor shared.</p>
      <input value={code} onChange={e => setCode(e.target.value)} placeholder="CS201-FALL-2026" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid #ccc", fontSize: 15, marginBottom: 16, boxSizing: "border-box", fontFamily: "monospace" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px" }}>
        <div style={{ flex: 1, height: 0.5, background: "#ddd" }} /><span style={{ fontSize: 12, color: "#aaa" }}>or</span><div style={{ flex: 1, height: 0.5, background: "#ddd" }} />
      </div>
      <input placeholder="Search by course name..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid #ccc", fontSize: 15, marginBottom: 24, boxSizing: "border-box" }} />
      <Button primary onClick={onNext} style={{ width: "100%" }}>Join course</Button>
    </div>
  );
}

// ─── SCREEN 4: INGESTING ────────────────
function IngestingScreen({ onNext }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [setTimeout(() => setStep(1), 800), setTimeout(() => setStep(2), 1800), setTimeout(() => setStep(3), 2800), setTimeout(() => setStep(4), 3600), setTimeout(() => onNext(), 4400)];
    return () => timers.forEach(clearTimeout);
  }, []);
  const items = ["Syllabus parsed — 14 topics, 6 assessments", "Lecture slides read — 24 decks, 380 slides", "Building concept graph — mapping prerequisites", "Linking concepts to assessments"];
  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>Setting up your course</h2>
      <p style={{ fontSize: 14, color: "#888", margin: "0 0 28px" }}>Reading materials and building the concept map.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: i <= step ? 1 : 0.3, transition: "opacity 0.4s" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, background: i < step ? "#E1F5EE" : i === step ? "#FAEEDA" : "#f5f5f0", color: i < step ? "#0F6E56" : i === step ? "#854F0B" : "#aaa" }}>
              {i < step ? "✓" : i === step ? "●" : "○"}
            </div>
            <span style={{ fontSize: 14, color: i <= step ? "#333" : "#aaa" }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCREEN 5: PICK DIRECTION ───────────
function DirectionScreen({ onNext }) {
  const [sel, setSel] = useState(null);
  const opts = [
    { id: "industry", icon: "▲", title: "Industry", desc: "Connect concepts to real jobs, skill demands, and interview questions." },
    { id: "research", icon: "◇", title: "Research", desc: "Go deeper — open problems, PhD directions, and academic connections." },
    { id: "unsure", icon: "○", title: "Not sure yet", desc: "See both paths. The app will learn your preference over time." },
  ];
  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>What's your goal?</h2>
      <p style={{ fontSize: 14, color: "#888", margin: "0 0 24px" }}>This shapes what you see beyond the academics. You can change this anytime.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {opts.map(o => (
          <div key={o.id} onClick={() => setSel(o.id)} style={{ padding: "14px 16px", borderRadius: 10, border: sel === o.id ? "2px solid #1a1a1a" : "0.5px solid #ddd", cursor: "pointer", transition: "all 0.15s", background: sel === o.id ? "#fafaf7" : "transparent" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{o.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{o.title}</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{o.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button primary disabled={!sel} onClick={() => onNext(sel)} style={{ width: "100%", marginTop: 20 }}>Continue</Button>
    </div>
  );
}

// ─── SCREEN 6: DIAGNOSTIC ───────────────
function DiagnosticScreen({ onNext }) {
  const questions = [
    { q: "What's the time complexity of searching an unsorted array?", opts: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correct: 2 },
    { q: "What happens when a recursive function has no base case?", opts: ["Returns null", "Stack overflow", "Compiles but does nothing", "Runs once and stops"], correct: 1 },
    { q: "Which traversal visits the root node first?", opts: ["In-order", "Pre-order", "Post-order", "Level-order"], correct: 1 },
  ];
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  function handleAnswer() {
    if (selected === null) return;
    setAnswered(true);
    setTimeout(() => {
      if (qi < questions.length - 1) { setQi(qi + 1); setSelected(null); setAnswered(false); }
      else onNext();
    }, 1000);
  }

  const cur = questions[qi];
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Quick diagnostic</h2>
        <span style={{ fontSize: 13, color: "#888" }}>{qi + 1} of {questions.length}</span>
      </div>
      <ProgressBar value={((qi + (answered ? 1 : 0)) / questions.length) * 100} color="#7F77DD" />
      <p style={{ fontSize: 16, margin: "24px 0 20px", lineHeight: 1.5, fontWeight: 500 }}>{cur.q}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cur.opts.map((o, i) => {
          let bg = "transparent", border = "0.5px solid #ddd", col = "#333";
          if (answered && i === cur.correct) { bg = "#E1F5EE"; border = "1.5px solid #5DCAA5"; col = "#085041"; }
          else if (answered && i === selected && i !== cur.correct) { bg = "#FCEBEB"; border = "1.5px solid #E24B4A"; col = "#791F1F"; }
          else if (!answered && i === selected) { bg = "#f5f5f0"; border = "1.5px solid #1a1a1a"; }
          return (
            <div key={i} onClick={() => !answered && setSelected(i)} style={{ padding: "12px 14px", borderRadius: 8, border, background: bg, color: col, cursor: answered ? "default" : "pointer", fontSize: 15, transition: "all 0.15s" }}>
              {o}
            </div>
          );
        })}
      </div>
      {!answered && <Button primary disabled={selected === null} onClick={handleAnswer} style={{ width: "100%", marginTop: 20 }}>Submit answer</Button>}
    </div>
  );
}

// ─── SCREEN 7: PICK TARGET ──────────────
function TargetScreen({ onNext }) {
  const [sel, setSel] = useState(null);
  const targets = [
    { id: "a2", label: "Assignment 2", due: "Friday, Oct 3", concepts: 5 },
    { id: "mid", label: "Midterm exam", due: "Wednesday, Oct 15", concepts: 7 },
    { id: "final", label: "Final exam", due: "December 12", concepts: 9 },
  ];
  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>What are you working toward?</h2>
      <p style={{ fontSize: 14, color: "#888", margin: "0 0 24px" }}>Pick your target. The graph will show you everything between here and there.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {targets.map(t => (
          <div key={t.id} onClick={() => setSel(t.id)} style={{ padding: "14px 16px", borderRadius: 10, border: sel === t.id ? "2px solid #1a1a1a" : "0.5px solid #ddd", cursor: "pointer", background: sel === t.id ? "#fafaf7" : "transparent", transition: "all 0.15s" }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{t.label}</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Due {t.due} — {t.concepts} concepts</div>
          </div>
        ))}
      </div>
      <Button primary disabled={!sel} onClick={() => onNext(sel)} style={{ width: "100%", marginTop: 20 }}>Build my graph</Button>
    </div>
  );
}

// ─── KNOWLEDGE GRAPH (SVG) ──────────────
function KnowledgeGraph({ mastery, target, onSelectNode, selectedNode }) {
  let visible = ["arrays", "linkedlists", "recursion", "stacks", "trees"];
  if (target === "mid" || target === "final") visible.push("bst", "sorting");
  if (target === "final") visible.push("graphs", "dp");

  const visibleSet = new Set(visible);
  const nodes = CONCEPTS.filter(c => visibleSet.has(c.id));
  const scale = target === "final" ? 0.82 : 1;
  const vw = target === "final" ? 680 : 660;
  const vh = target === "final" ? 420 : 300;

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10" fill="none" stroke="#bbb" strokeWidth="1.5" />
        </marker>
      </defs>
      {nodes.map(n => n.prereqs.filter(p => visibleSet.has(p)).map(p => {
        const from = CONCEPTS.find(c => c.id === p);
        if (!from) return null;
        return <line key={`${p}-${n.id}`} x1={from.x * scale + 50} y1={from.y * scale} x2={n.x * scale - 50} y2={n.y * scale} stroke="#ccc" strokeWidth={1} markerEnd="url(#ah)" />;
      }))}
      {nodes.map(n => {
        const m = MASTERY[mastery[n.id]] || MASTERY.locked;
        const isSel = selectedNode === n.id;
        return (
          <g key={n.id} onClick={() => mastery[n.id] !== "locked" && onSelectNode(n.id)} style={{ cursor: mastery[n.id] === "locked" ? "default" : "pointer" }}>
            <rect x={n.x * scale - 56} y={n.y * scale - 22} width={112} height={44} rx={8} fill={m.bg} stroke={isSel ? m.color : "transparent"} strokeWidth={isSel ? 2.5 : 0} opacity={mastery[n.id] === "locked" ? 0.45 : 1} />
            <text x={n.x * scale} y={n.y * scale - 2} textAnchor="middle" fontSize={12} fontWeight={500} fill={mastery[n.id] === "locked" ? "#aaa" : "#333"} style={{ pointerEvents: "none" }}>{n.label}</text>
            <text x={n.x * scale} y={n.y * scale + 14} textAnchor="middle" fontSize={10} fill={m.color} style={{ pointerEvents: "none" }}>{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── CONCEPT DETAIL PANEL ───────────────
function ConceptPanel({ concept, mastery, direction, onStartLearning, onClose }) {
  const c = CONCEPTS.find(n => n.id === concept);
  if (!c) return null;
  const m = MASTERY[mastery] || MASTERY.locked;
  return (
    <div style={{ border: "0.5px solid #ddd", borderRadius: 12, padding: "20px 22px", background: "#fff", marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 500 }}>{c.label}</h3>
          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: m.bg, color: m.color, fontWeight: 500 }}>{m.label}</span>
        </div>
        <span onClick={onClose} style={{ cursor: "pointer", fontSize: 18, color: "#aaa", padding: 4 }}>✕</span>
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
        <div style={{ display: "flex", gap: 10 }}><span style={{ color: "#888", minWidth: 90 }}>Covers</span><span style={{ color: "#333", flex: 1 }}>{c.covers}</span></div>
        <div style={{ display: "flex", gap: 10 }}><span style={{ color: "#888", minWidth: 90 }}>Shows up in</span><span style={{ color: "#333", flex: 1 }}>{c.assmt}</span></div>
        <div style={{ display: "flex", gap: 10 }}><span style={{ color: "#888", minWidth: 90 }}>Est. time</span><span style={{ color: "#333", flex: 1 }}>{c.estTime}</span></div>
        <div style={{ display: "flex", gap: 10 }}><span style={{ color: "#888", minWidth: 90 }}>{direction === "research" ? "Research" : "Industry"}</span><span style={{ color: "#333", flex: 1, fontStyle: "italic" }}>{direction === "research" ? c.research : c.industry}</span></div>
      </div>
      {mastery !== "mastered" && (
        <Button primary onClick={onStartLearning} style={{ width: "100%", marginTop: 18 }}>
          {mastery === "inprogress" ? "Continue learning" : "Start learning"}
        </Button>
      )}
    </div>
  );
}

// ─── LEARNING SCREEN ────────────────────
function LearningScreen({ concept, direction, onComplete, onBack }) {
  const c = CONCEPTS.find(n => n.id === concept);
  const [phase, setPhase] = useState("teach");
  const [probeAnswer, setProbeAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showIndustry, setShowIndustry] = useState(false);

  if (!c) return null;

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span onClick={onBack} style={{ cursor: "pointer", fontSize: 14, color: "#888" }}>← Back to graph</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: phase === "teach" ? "#EEEDFE" : phase === "probe" ? "#FAEEDA" : "#E1F5EE", color: phase === "teach" ? "#534AB7" : phase === "probe" ? "#854F0B" : "#0F6E56", fontWeight: 500 }}>
          {phase === "teach" ? "Learning" : phase === "probe" ? "Checking understanding" : direction === "research" ? "Research depth" : "Interview prep"}
        </span>
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 20px" }}>{c.label}</h2>

      {phase === "teach" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#f9f9f6", borderRadius: 10, padding: "14px 16px", fontSize: 14, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 500, marginBottom: 6, color: "#333" }}>Concept overview</div>
            <div style={{ color: "#555" }}>{c.covers}</div>
          </div>
          <div style={{ background: "#f9f9f6", borderRadius: 10, padding: "14px 16px", fontSize: 14, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 500, marginBottom: 6, color: "#333" }}>Why this matters</div>
            <div style={{ color: "#555" }}>{direction === "research" ? c.research : c.industry}</div>
          </div>
          <div style={{ background: "#f5f3ff", borderRadius: 10, padding: "14px 16px", fontSize: 14, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 500, marginBottom: 6, color: "#534AB7" }}>Key insight</div>
            <div style={{ color: "#555" }}>The tutor would teach this concept step-by-step here — with explanations, code, visuals, and examples adapted to your learning style. This is a focused learning module, not a chatbot.</div>
          </div>
          <Button primary onClick={() => setPhase("probe")} style={{ marginTop: 8 }}>I've got it — check my understanding</Button>
        </div>
      )}

      {phase === "probe" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#FFF8EB", borderRadius: 10, padding: "14px 16px", fontSize: 14, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 500, marginBottom: 6, color: "#854F0B" }}>Probing question</div>
            <div style={{ color: "#555" }}>{direction === "research" ? c.researchQ : c.interviewQ}</div>
          </div>
          <textarea value={probeAnswer} onChange={e => setProbeAnswer(e.target.value)} placeholder="Type your answer..." rows={4} style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "0.5px solid #ccc", fontSize: 15, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
          {!showResult ? (
            <Button primary disabled={!probeAnswer.trim()} onClick={() => setShowResult(true)}>Submit answer</Button>
          ) : (
            <div>
              <div style={{ background: "#E1F5EE", borderRadius: 10, padding: "14px 16px", fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>
                <div style={{ fontWeight: 500, marginBottom: 4, color: "#0F6E56" }}>Feedback</div>
                <div style={{ color: "#085041" }}>The AI tutor evaluates your answer here — identifying what you got right, what's missing, and any misconceptions. If there's a gap, it addresses the specific misunderstanding before marking the concept.</div>
              </div>
              <Button primary onClick={() => setPhase("career")} style={{ width: "100%" }}>
                Continue to {direction === "research" ? "research depth" : "interview prep"}
              </Button>
            </div>
          )}
        </div>
      )}

      {phase === "career" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: direction === "research" ? "#f5f3ff" : "#f0f7ff", borderRadius: 10, padding: "14px 16px", fontSize: 14, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 500, marginBottom: 6, color: direction === "research" ? "#534AB7" : "#185FA5" }}>
              {direction === "research" ? "Research connection" : "Industry relevance"}
            </div>
            <div style={{ color: "#555" }}>{direction === "research" ? c.research : c.industry}</div>
          </div>
          {!showIndustry ? (
            <div style={{ background: "#f9f9f6", borderRadius: 10, padding: "14px 16px", fontSize: 14 }}>
              <div style={{ fontWeight: 500, marginBottom: 6 }}>
                {direction === "research" ? "Try this deeper question" : "Sample interview question"}
              </div>
              <div style={{ color: "#555", fontStyle: "italic" }}>{direction === "research" ? c.researchQ : c.interviewQ}</div>
              <Button small onClick={() => setShowIndustry(true)} style={{ marginTop: 12 }}>Show guidance</Button>
            </div>
          ) : (
            <div style={{ background: "#E1F5EE", borderRadius: 10, padding: "14px 16px", fontSize: 14, lineHeight: 1.7 }}>
              <div style={{ fontWeight: 500, color: "#0F6E56", marginBottom: 4 }}>Approach</div>
              <div style={{ color: "#085041" }}>The system provides a detailed walkthrough of how to approach this {direction === "research" ? "research problem" : "interview question"}, building on the concept you just mastered.</div>
            </div>
          )}
          <Button primary onClick={onComplete} style={{ marginTop: 8 }}>Mark as mastered — return to graph</Button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN DASHBOARD ─────────────────────
function Dashboard({ direction, target, mastery, setMastery, onChangeTarget }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [learning, setLearning] = useState(null);

  const totalVisible = target === "final" ? 9 : target === "mid" ? 7 : 5;
  const masteredCount = Object.values(mastery).filter(v => v === "mastered").length;
  const readiness = Math.round((Math.min(masteredCount, totalVisible) / totalVisible) * 100);

  function handleComplete(conceptId) {
    const newMastery = { ...mastery, [conceptId]: "mastered" };
    CONCEPTS.forEach(c => {
      if (newMastery[c.id] === "locked" || newMastery[c.id] === "ready") {
        const allPreqsMet = c.prereqs.every(p => newMastery[p] === "mastered");
        if (allPreqsMet) newMastery[c.id] = "ready";
      }
    });
    setMastery(newMastery);
    setLearning(null);
    setSelectedNode(null);
  }

  if (learning) {
    return <LearningScreen concept={learning} direction={direction} onComplete={() => handleComplete(learning)} onBack={() => setLearning(null)} />;
  }

  const targetLabels = { a2: "Assignment 2 — Friday", mid: "Midterm — Oct 15", final: "Final — Dec 12" };

  return (
    <div style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>CS 201 — Data structures</h2>
        <span style={{ fontSize: 13, color: "#888" }}>{direction === "research" ? "Research track" : direction === "industry" ? "Industry track" : "Exploring"}</span>
      </div>
      <p style={{ fontSize: 14, color: "#888", margin: "0 0 16px" }}>Target: {targetLabels[target]}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        <div style={{ background: "#f9f9f6", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#888" }}>Readiness</div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>{readiness}%</div>
          <ProgressBar value={readiness} />
        </div>
        <div style={{ background: "#f9f9f6", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#888" }}>Mastered</div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>{masteredCount} / {totalVisible}</div>
        </div>
        <div style={{ background: "#f9f9f6", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#888" }}>Est. remaining</div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>~{Math.max(0, (totalVisible - masteredCount)) * 3}h</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Your knowledge graph</span>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#888" }}>
          {Object.entries(MASTERY).map(([k, v]) => (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: v.color, display: "inline-block" }} />{v.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ border: "0.5px solid #eee", borderRadius: 12, padding: "12px 8px", background: "#fefefe" }}>
        <KnowledgeGraph mastery={mastery} target={target} onSelectNode={setSelectedNode} selectedNode={selectedNode} />
      </div>

      {selectedNode && (
        <ConceptPanel concept={selectedNode} mastery={mastery[selectedNode]} direction={direction} onStartLearning={() => setLearning(selectedNode)} onClose={() => setSelectedNode(null)} />
      )}

      {!selectedNode && (
        <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", marginTop: 14 }}>Click any unlocked node to see details and start learning.</p>
      )}
    </div>
  );
}

// ─── APP ROOT ───────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [direction, setDirection] = useState("industry");
  const [target, setTarget] = useState("mid");
  const [mastery, setMastery] = useState(getInitialMastery);

  switch (screen) {
    case "landing": return <LandingScreen onNext={() => setScreen("signup")} />;
    case "signup": return <SignUpScreen onNext={() => setScreen("join")} />;
    case "join": return <JoinCourseScreen onNext={() => setScreen("ingesting")} />;
    case "ingesting": return <IngestingScreen onNext={() => setScreen("direction")} />;
    case "direction": return <DirectionScreen onNext={d => { setDirection(d); setScreen("diagnostic"); }} />;
    case "diagnostic": return <DiagnosticScreen onNext={() => setScreen("target")} />;
    case "target": return <TargetScreen onNext={t => { setTarget(t); setScreen("dashboard"); }} />;
    case "dashboard": return <Dashboard direction={direction} target={target} mastery={mastery} setMastery={setMastery} />;
    default: return null;
  }
}
