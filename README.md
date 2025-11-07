# Requirment
```bash
# Node Version
>= 18.20.3
```

# How To Install ?
```bash
# Run this code on terminal
npm install

# Create file .env, or copy from sample.env
touch .env
```


# How To Run ?

## SNAP
```bash
node simulator.js snap [create, inquiry, status, ...]
```
- ### example:
    ```bash
    # Create VA
    node simulator.js snap create

    # Check VA (exist or no)
    node simulator.js snap inquiry

    # Check transaction status/bayar
    node simulator.js snap status
    ```

## Chekout Page
```bash
node simulator.js checkoutpage [create, find, ...]
```
- ### example:
    ```bash
    # Create Invoice
    node simulator.js checkoutpage create

    # Find invoice (by id invoice)
    node simulator.js checkoutpage find
    ```