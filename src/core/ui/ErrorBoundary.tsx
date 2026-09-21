import { Component, type PropsWithChildren, type ReactNode } from "react";

import { createLogger } from "../logging";
import { ErrorState } from "./ErrorState";

const log = createLogger("error-boundary");

interface State {
  error: Error | null;
}

/**
 * One instance wraps each feature's screen tree (see app/(tabs)/<feature>.tsx),
 * so a crash in one feature never takes down the whole app.
 */
export class FeatureErrorBoundary extends Component<PropsWithChildren<{ featureId: string }>, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    log.error(`crash in feature "${this.props.featureId}"`, { message: error.message });
  }

  private reset = () => this.setState({ error: null });

  render(): ReactNode {
    if (this.state.error) {
      return <ErrorState error={this.state.error} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}
