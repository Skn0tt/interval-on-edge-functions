# Interval on Edge Functions

I stumbled accross https://interval.com, and found it *really* interesting.
It's a tool for rapidly building internal tooling based on an existing codebase,
and uses an interesting paradigm where state is kept in a long-lived session on the server,
and the UI is "remote-controlled" by it.

It got me thinking: What would it take to implement something like this via Edge Functions?

## How does Interval work?

To understand the idea of this proof-of-concept, let's look at why I find Interval so
intriguing.

This codesnippet is taken from Interval's landing page, and would live in your application's codebase:

```ts
async function refond_user(io, ctx) {
  const email = await io.input.email("Email");

  const charges = await getCharges({ email });

  const toRefund = await io.select.table(
    "Select one or more charges to refund",
    { data: charges }
  );

  ctx.loading.start({
    label: "Refunding charges",
    itemsInQueue: toRefund.length,
  });

  for (const charge of toRefund) {
    await refundCharge(charge.id);
    ctx.loading.completeOne();
  }
}

new Interval({ actions: { refund_user } }).listen();
```

This code runs as part of your application codebase. `new Interval(...).listen()` opens a long-runnning connection to the Interval servers and registers the available workflows (Interval calls them `actions`).
When a workflow is started, the Interval servers call your application server to start a workflow session (Interval calls them `transactions`).
The workflows then can use the `await io.input.[...]` methods to request user input,
which Interval relays to the logged-in user.

The model is: your application keeps all state, and `Interval` is an easy-to-build interaction layer.
I really like it, as it allows colocating internal tooling with the rest of the codebase.
Though, with the current paradigm of stateless + shortlived servers, the idea of a long-running session
on the server sounds like an impedance mismatch.
This would simply not be possible to implement with AWS Lambda, for example!
It's maximum execution time of 15 minutes limits what kind of workflows one can implement using this.

However, with Deno limiting by *CPU time* as opposed to *execution time*, this can become more feasible.
These workflows idle for most of the time, so they should be relatively easy to keep running for long.

## How does the PoC work?

The goal of this repoistory is to re-implement the functionality described above as simple as possible,
and to use Netlify Edge Functions for it.
The Edge Function implements the workflow, makes requests to databases and APIs, a single-page UI
acts as a remote-controlled UI.
UI and workflow need a two-way communication
channel. Ideally, this would be a websocket.
Edge Functions don't directly support them, so we'll use [SimpleMQ](https://gitlab.com/Skn0tt/simplemq) as a relay for now.

## Try it out

Go to https://interval-on-edge-functions.netlify.app to check it out,
and read through the code in this repository to check how it's implemented!
