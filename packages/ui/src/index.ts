export type UiCardProps = {
  title: string;
  description?: string;
};

export function buildCardLabel(props: UiCardProps) {
  return props.description ? `${props.title} / ${props.description}` : props.title;
}
