/**
 * Conversational layout: assistant message (left) + user reply panel + composer-style actions.
 * Matches onboarding spec: chat-led, not a stacked business form.
 */
export default function OnboardingChatShell({
  assistantEyebrow = 'Onevo',
  assistantHeadline,
  assistantBody,
  userPanelTitle = 'Your reply',
  children,
  error,
  errorId,
  footer,
  className = ''
}) {
  return (
    <div className={`onboarding-step onboarding-step--chat ${className}`.trim()}>
      <div className="onboarding-chat-thread" role="log" aria-live="polite" aria-relevant="additions">
        <div className="onboarding-chat-row onboarding-chat-row--assistant">
          <div className="onboarding-chat-avatar" aria-hidden="true">
            <span>O</span>
          </div>
          <div className="onboarding-chat-bubble onboarding-chat-bubble--assistant">
            <p className="onboarding-chat-eyebrow">{assistantEyebrow}</p>
            {assistantHeadline ? <h2 className="onboarding-chat-headline">{assistantHeadline}</h2> : null}
            {assistantBody ? <div className="onboarding-chat-body">{assistantBody}</div> : null}
          </div>
        </div>

        <div className="onboarding-chat-row onboarding-chat-row--user">
          <div className="onboarding-chat-user-wrap">
            <p className="onboarding-chat-user-label">{userPanelTitle}</p>
            <div className="onboarding-chat-bubble onboarding-chat-bubble--user">{children}</div>
          </div>
        </div>
      </div>

      {error ? (
        <p id={errorId} className="onboarding-error onboarding-error--chat" role="alert">
          {error}
        </p>
      ) : null}

      {footer ? <div className="onboarding-chat-composer">{footer}</div> : null}
    </div>
  );
}
