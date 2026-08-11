import { useEffect } from "react";
import { useStore } from "../data/store";

export function Toast() {
  const { state, dispatch } = useStore();

  useEffect(() => {
    if (!state.toast) return;
    const id = window.setTimeout(() => dispatch({ type: "CLEAR_TOAST" }), 2200);
    return () => window.clearTimeout(id);
  }, [state.toast, dispatch]);

  return <div className={"toast" + (state.toast ? " show" : "")} role="status" aria-live="polite">{state.toast}</div>;
}
