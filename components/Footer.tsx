export function Footer() {
  return (
    <footer className="border-t border-border/40 px-6 py-6 text-center text-sm text-muted-foreground">
      Citable &mdash; Built for the AI search era
      <br />
      &copy; {new Date().getFullYear()} Danilo Correia. All rights reserved.
    </footer>
  )
}
