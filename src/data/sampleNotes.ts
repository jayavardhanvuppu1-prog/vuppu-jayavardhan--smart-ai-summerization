export interface SampleNoteSet {
  id: string;
  title: string;
  subject: string;
  readingTime: string;
  content: string;
}

export const SAMPLE_NOTES: SampleNoteSet[] = [
  {
    id: "cellular-respiration",
    title: "Cellular Respiration & ATP Production",
    subject: "Biology",
    readingTime: "3 min read",
    content: `Cellular Respiration Overview
Cellular respiration is the set of metabolic reactions and processes that take place in the cells of organisms to convert chemical energy from oxygen molecules or nutrients into adenosine triphosphate (ATP), and then release waste products.

Overall Chemical Equation:
C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ~30-32 ATP

1. Glycolysis (Cytoplasm)
- Occurs in the cytosol and does not require oxygen (anaerobic).
- Breaks one 6-carbon glucose molecule into two 3-carbon pyruvate molecules.
- Investment phase consumes 2 ATP; payoff phase produces 4 ATP and 2 NADH.
- Net yield: 2 ATP, 2 NADH, and 2 Pyruvate.

2. Pyruvate Oxidation & Citric Acid Cycle / Krebs Cycle (Mitochondrial Matrix)
- In the presence of oxygen, pyruvate enters the mitochondrial matrix and is converted into Acetyl-CoA by pyruvate dehydrogenase, releasing CO2 and generating 1 NADH per pyruvate.
- Acetyl-CoA (2 carbons) joins oxaloacetate (4 carbons) to form citrate (6 carbons).
- Per glucose molecule (2 turns of the cycle), the Krebs cycle yields: 2 ATP (via GTP), 6 NADH, 2 FADH2, and 4 CO2 as waste.

3. Oxidative Phosphorylation: Electron Transport Chain & Chemiosmosis (Inner Mitochondrial Membrane)
- NADH and FADH2 donate high-energy electrons to protein complexes (Complexes I-IV) embedded in the inner mitochondrial membrane.
- As electrons move down the chain, protons (H+) are pumped from the mitochondrial matrix into the intermembrane space, establishing an electrochemical gradient (proton-motive force).
- Oxygen serves as the final electron acceptor at Complex IV, combining with electrons and H+ to form water (H2O). Without oxygen, the chain backs up and stops.
- Protons flow back into the matrix through ATP synthase, driving the phosphorylation of ADP + Pi into ATP (chemiosmosis).
- Oxidative phosphorylation produces roughly 26-28 ATP per glucose, accounting for ~90% of cellular ATP.

Anaerobic Fermentation
When oxygen is unavailable, cells regenerate NAD+ from NADH so glycolysis can continue:
- Lactic acid fermentation (mammalian muscle cells, some bacteria): Pyruvate is reduced to lactate.
- Alcoholic fermentation (yeast): Pyruvate is converted to ethanol and CO2.`,
  },
  {
    id: "neural-networks",
    title: "Neural Networks & Backpropagation",
    subject: "Computer Science",
    readingTime: "3 min read",
    content: `Artificial Neural Networks Fundamentals
An artificial neural network (ANN) is a computational model inspired by biological neurons. It learns patterns from data by adjusting numeric weights on connections between nodes across layers.

1. Architecture of a Feedforward Network
- Input Layer: Receives raw features (e.g., pixel intensities or tabular measurements).
- Hidden Layers: Intermediate layers where weighted sums and nonlinear transformations extract hierarchical representations.
- Output Layer: Produces final predictions (e.g., class probabilities via Softmax or continuous values for regression).

2. Forward Propagation
Each neuron computes a weighted sum of its inputs plus a bias term:
z = W * x + b
Then it applies a nonlinear activation function: a = f(z).
Common activation functions:
- ReLU (Rectified Linear Unit): f(z) = max(0, z). Mitigates vanishing gradients and computes efficiently.
- Sigmoid: f(z) = 1 / (1 + e^-z). Maps values between 0 and 1, useful for binary probability outputs.
- Tanh: Maps values between -1 and 1, zero-centered.
Without nonlinear activation functions, stacking multiple layers collapses mathematically into a single linear transformation.

3. Loss Functions
A loss function quantifies how far the network's prediction is from the true target:
- Mean Squared Error (MSE): Used for regression problems.
- Cross-Entropy Loss: Used for classification problems; penalizes confident wrong predictions heavily.

4. Backpropagation & Gradient Descent
- Backpropagation applies the chain rule of calculus backward from the output layer to the input layer to compute the gradient of the loss with respect to every weight and bias (dL/dW).
- Gradient Descent updates each weight in the opposite direction of its gradient:
  W_new = W_old - learning_rate * (dL/dW)
- Learning Rate (alpha): Controls step size. Too high causes divergence; too low causes slow training or getting stuck in poor local minima.
- Regularization techniques such as Dropout (randomly zeroing activations during training) and L2 weight decay prevent overfitting, ensuring the model generalizes to unseen test data.`,
  },
  {
    id: "macro-policy",
    title: "Macroeconomics: Monetary & Fiscal Policy",
    subject: "Economics",
    readingTime: "3 min read",
    content: `Stabilizing the Business Cycle
Governments and central banks use fiscal and monetary policy to manage aggregate demand, stabilize prices (control inflation), and promote low unemployment.

1. Fiscal Policy (Government Spending & Taxation)
Managed by Congress/Parliament and the Executive branch:
- Expansionary Fiscal Policy: Used during recessions to close a recessionary gap. Increases government spending (G) or cuts taxes (T), boosting disposable income and aggregate demand (AD). Because of the spending multiplier (1 / (1 - MPC)), an initial dollar of spending generates more than one dollar of total GDP growth.
- Contractionary Fiscal Policy: Used during inflationary booms. Decreases government spending or raises taxes to cool down aggregate demand.
- Crowding-Out Effect: When the government borrows heavily to finance deficit spending, increased demand for loanable funds drives up real interest rates, which can reduce private business investment.

2. Monetary Policy (Money Supply & Interest Rates)
Managed independently by the Central Bank (e.g., the Federal Reserve):
- Open Market Operations (OMO): The most frequently used tool. Buying government bonds injects reserves into the banking system, lowering the federal funds rate and encouraging borrowing (expansionary). Selling bonds pulls reserves out and raises interest rates (contractionary).
- Reserve Requirement & Discount Rate: Lowering the reserve ratio or the discount rate makes it cheaper for commercial banks to lend.
- Taylor Rule & Dual Mandate: Central banks balance price stability (~2% target inflation) with maximum sustainable employment.

3. Key Trade-offs & Lags
- Fiscal policy faces inside lags (legislative debate and approval delays) but acts directly once enacted.
- Monetary policy has shorter decision lags (central bank committees meet regularly) but longer outside transmission lags (6-18 months before interest rate changes fully affect investment and inflation).
- Stagflation (simultaneous high inflation and high unemployment, often from negative supply shocks) poses a dilemma because stimulating demand worsens inflation while tightening policy worsens unemployment.`,
  },
];
