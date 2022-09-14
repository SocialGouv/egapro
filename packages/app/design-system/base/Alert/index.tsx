import React from "react"
import clsx from "clsx"

interface AlertPropsCommon {
  type?: "error" | "warning" | "success" | "info"
}

interface AlertSM extends AlertPropsCommon {
  description: string
  size?: "sm"
  title?: string
}

interface AlertMD extends AlertPropsCommon {
  description?: string
  size?: "md"
  title: string
}

type AlertProps = AlertSM | AlertMD

const Alert = ({
  type = "info",
  size = "md",
  title,
  description,
  ...rest
}: AlertProps) => {
  return (
    <div
      role="alert"
      className={clsx(
        "fr-alert",
        type === "error" && "fr-alert--error",
        type === "success" && "fr-alert--success",
        type === "info" && "fr-alert--info",
        type === "warning" && "fr-alert--warning",
        size === "sm" && "fr-alert--sm"
      )}
      {...rest}
    >
      {size === "md" && <p className="fr-alert__title">{title}</p>}
      {description && <p>{description}</p>}
    </div>
  )
}

export default Alert
