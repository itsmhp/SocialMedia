import { useStore } from "../data/store";

export function PlayScreen() {
  const { state, dispatch } = useStore();
  const g = state.game;
  const members = [state.me, ...state.friends];
  const total = Object.values(g.votes).reduce((a, b) => a + b, 0);

  return (
    <section className="screen active">
      <div className="section-head">
        <h2>Play Together</h2>
        <span>just for fun</span>
      </div>
      <div className="game-card">
        <div className="game-q">
          Most likely to… <b>{g.prompts[g.idx]}</b>
        </div>
        <div className="game-options">
          {members.map((m) => {
            const v = g.votes[m.name] || 0;
            const pct = total ? Math.round((v / total) * 100) : 0;
            const mine = g.mine === m.name;
            return (
              <button
                key={m.name}
                className={"gopt" + (mine ? " mine" : "")}
                onClick={() => dispatch({ type: "VOTE_GAME", name: m.name })}
              >
                <span className="ava sm">{m.avatar}</span>
                <span className="gname">{m.name}</span>
                <span className="gbar">
                  <i style={{ width: pct + "%" }} />
                </span>
                <span className="gpct">{pct}%</span>
              </button>
            );
          })}
        </div>
        <button className="btn-ghost" onClick={() => dispatch({ type: "NEXT_GAME" })}>
          New question 🔀
        </button>
      </div>
    </section>
  );
}
