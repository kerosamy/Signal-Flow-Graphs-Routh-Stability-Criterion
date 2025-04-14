import threading
import matplotlib.pyplot as plt
import networkx as nx
from flask import Flask, jsonify, request
from flask_cors import CORS
import sympy as sp
from itertools import combinations

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def build_graph(nodes, edges):
    G = nx.MultiDiGraph()  # Use MultiDiGraph to allow parallel edges
    for node in nodes:
        G.add_node(node['id'])
    for i, edge in enumerate(edges):
        weight = sp.sympify(edge['label'])
        print(weight)
        print(i)
        G.add_edge(edge['source'], edge['target'], weight=weight, id=f"edge_{i}")
    return G
def get_edge_weight_by_id(G, edge_id):
    # Iterate through all edges in the graph (with keys, if it's a MultiDiGraph)
    for u, v, key, data in G.edges(data=True, keys=True):
        # Check if the edge's id matches the given id
        if data.get('id') == edge_id:
            # Return the weight of the edge
            return data.get('weight')  # or use the key to get other attributes if needed
    return None  # Return None if the edge with the given id was not found

def draw_graph(G):
    print("\nGraph Structure:")
    print("Nodes:")
    for node in G.nodes:
        print(f"  {node}")
    
    print("Edges:")
    for u, v, data in G.edges(data=True):
        print(f"  {u} -> {v}  (weight = {data['weight']})")
    # Visualization code commented out as in original

def find_forward_paths(G, source, sink, path=None, edge_used=None, all_paths=None):
    if path is None:
        path = []
    if edge_used is None:
        edge_used = []
    if all_paths is None:
        all_paths = []
    
    path = path + [source]
    
    if source == sink:
        all_paths.append({"path": path.copy(), "edges_used": edge_used.copy()})
        return all_paths
    
    # Get all outgoing edges
    for u, v, edge_data in G.out_edges(source, data=True):
        if v not in path:  # Avoid cycles
            new_edge_used = edge_used + [edge_data['id']]
            find_forward_paths(G, v, sink, path, new_edge_used, all_paths)
    
    return all_paths

def find_unique_loops(G):
    all_loops = []
    all_gains = []
    seen_loops = set()
    
    for start_node, second_node, key, data in G.edges(data=True, keys=True):
        print(start_node)
        print(second_node)
        if(start_node==second_node):
            path = [start_node,second_node]
            gain = [data['id']]
            cycle_key = tuple(sorted(path))
            gain_values = tuple(sorted(gain))
            unique_key = (cycle_key, gain_values)
            if unique_key not in seen_loops:
                seen_loops.add(unique_key)
                all_loops.append(path)
                all_gains.append(gain)
            continue
        visited = {start_node, second_node}
        path = [start_node, second_node]
        gain = [data['id']]
        dfs_find_loops(G, second_node, start_node, visited, path, all_loops, seen_loops, gain, all_gains)
    
    # Create pairs of loops and gains for sorting
    loop_gain_pairs = list(zip(all_loops, all_gains))
    
    # Sort pairs based on some criteria, for example, the first node in the loop
    # You can change the sorting key based on your specific requirements
    sorted_pairs = sorted(loop_gain_pairs, key=lambda x: (min(x[0]), len(x[0])))
    
    sorted_loops, sorted_gains = zip(*sorted_pairs) if loop_gain_pairs else ([], [])
    gain_products = []
    
    # Iterate through each list of edge ids in sorted_gains
    for edge_ids in sorted_gains:
        gain_product = 1
        for edge_id in edge_ids:
            gain = get_edge_weight_by_id(G, edge_id)  # Get the gain for the edge id
            gain_product *= gain  # Multiply the gains
        
        gain_products.append(gain_product)

    return list(sorted_loops), list(gain_products)

def dfs_find_loops(G, current, start_node, visited, path, all_loops, seen_loops, gain, all_gains):
    for _, neighbor, key, data in G.out_edges(current, data=True, keys=True):
        if neighbor == start_node:
            current_cycle = path + [start_node]
            current_gain = gain + [data['id']] 
            canonical_cycle = canonicalize_cycle(current_cycle)
            cycle_key = tuple(sorted(canonical_cycle))
            gain_values = tuple(sorted(current_gain))
            unique_key = (cycle_key, gain_values)
            print(unique_key)
            
            if unique_key not in seen_loops:
                seen_loops.add(unique_key)
                all_loops.append(current_cycle)
                all_gains.append(current_gain)
        
        elif neighbor not in visited:
            visited.add(neighbor)
            path.append(neighbor)
            gain.append(data['id'])
            dfs_find_loops(G, neighbor, start_node, visited, path, all_loops, seen_loops, gain, all_gains)
            path.pop()
            gain.pop()
            visited.remove(neighbor)

def canonicalize_cycle(cycle):
    """
    Convert cycle to canonical form (starting with lexicographically smallest node)
    """
    cycle = cycle[:-1]
    min_node = min(cycle)
    min_idx = cycle.index(min_node)
    canonical = cycle[min_idx:] + cycle[:min_idx] + [min_node]
    return canonical

def calculate_path_gain(G, path, edges_used=None):
    """
    Calculate the gain of a path, optionally using specific edges identified by their IDs.
    """
    gain = 1
    
    if edges_used and isinstance(edges_used, list):
        # If we have specific edges to use
        edge_idx = 0
        for i in range(len(path) - 1):
            # Get all edges between these nodes
            edge_data = G.get_edge_data(path[i], path[i + 1])
            
            # Find the specific edge we want to use
            edge_id = edges_used[edge_idx]
            
            found = False
            for key, edge in edge_data.items():
                if edge.get('id') == edge_id:
                    gain *= edge['weight']
                    found = True
                    break
            
            if not found:
                # If edge not found, use the first one (fallback)
                gain *= edge_data[0]['weight']
            
            edge_idx += 1
    else:
        # Traditional approach - use first edge when multiple exist
        for i in range(len(path) - 1):
            edge_data = G.get_edge_data(path[i], path[i + 1])
            
            if isinstance(edge_data, dict):
                # For MultiDiGraph, edge_data is a dict with keys as edge indices
                if len(edge_data) > 0:
                    edge = edge_data[0]  # Use the first edge by default
                    gain *= edge['weight']
            else:
                # For simple graphs where edge_data is not a dict
                gain *= edge_data['weight']
    
    return gain

def are_touching(loop1, loop2):
    """Check if two loops share any nodes"""
    # Remove the duplicate end node for comparison
    set1 = set(loop1[:-1])
    set2 = set(loop2[:-1])
    return bool(set1.intersection(set2))

def calculate_determinant(G, loops, loop_mapping=None):
    """Calculate the determinant Δ using Mason's formula with optimized non-touching loop detection"""
    # If no loops, determinant is 1
    if not loops:
        return 1
    
    # Calculate individual loop gains
    loop_gains = [calculate_path_gain(G, loop) for loop in loops]
    
    # Find all non-touching loop pairs
    non_touching_pairs = []
    for i, j in combinations(range(len(loops)), 2):
        if not are_touching(loops[i], loops[j]):
            non_touching_pairs.append((i, j))
    
    # Find all higher-order non-touching combinations hierarchically
    all_non_touching_groups = {2: non_touching_pairs}
    
    # For orders 3 and above
    for order in range(3, len(loops) + 1):
        non_touching_n = []
        
        # For each potential loop to add to existing groups of order-1
        for group in all_non_touching_groups[order-1]:
            for idx in range(len(loops)):
                # Skip if idx is already in the group
                if idx in group:
                    continue
                
                # Check if idx forms a non-touching pair with every element in the group
                is_valid = True
                for existing_idx in group:
                    if (min(idx, existing_idx), max(idx, existing_idx)) not in non_touching_pairs:
                        is_valid = False
                        break
                
                if is_valid:
                    # Create a new group with idx added
                    new_group = tuple(sorted(group + (idx,)))
                    if new_group not in non_touching_n:
                        non_touching_n.append(new_group)
        
        # If no groups of this order exist, we can stop
        if not non_touching_n:
            break
            
        all_non_touching_groups[order] = non_touching_n
    
    if loop_mapping:
        # Create symbolic representation
        terms = ["1"]  # Start with 1
        
        # First-order terms: -L1, -L2, etc.
        for i, gain in enumerate(loop_gains):
            loop_symbol = loop_mapping[i]
            terms.append(f"-{loop_symbol}")
        
        # Add higher-order terms with appropriate signs
        for order, groups in all_non_touching_groups.items():
            sign = "+" if order % 2 == 0 else "-"  # + for even, - for odd orders
            for group in groups:
                term = f"{sign}{loop_mapping[group[0]]}"
                for idx in group[1:]:
                    term += f"*{loop_mapping[idx]}"
                terms.append(term)
        
        # Join all terms to form the determinant expression
        delta_expr = " ".join(terms)
        
        # Calculate numeric value
        numeric_delta = 1
        numeric_delta -= sum(loop_gains)
        
        for order, groups in all_non_touching_groups.items():
            sign = 1 if order % 2 == 0 else -1  # +1 for even, -1 for odd orders
            for group in groups:
                product = 1
                for idx in group:
                    product *= loop_gains[idx]
                numeric_delta += sign * product
        
        return {
            "expression": delta_expr,
            "numeric_value": sp.simplify(numeric_delta)
        }
    else:
        # Calculate numeric determinant
        delta = 1
        delta -= sum(loop_gains)
        
        for order, groups in all_non_touching_groups.items():
            sign = 1 if order % 2 == 0 else -1  # +1 for even, -1 for odd orders
            for group in groups:
                product = 1
                for idx in group:
                    product *= loop_gains[idx]
                delta += sign * product
        
        return sp.simplify(delta)

def calculate_path_determinant(G, path, loops, loop_mapping=None):
    """Calculate determinant Δₖ for a specific forward path using optimized approach"""
    # Find loops that touch this path
    path_nodes = set(path)
    non_touching_indices = []
    
    for i, loop in enumerate(loops):
        loop_nodes = set(loop[:-1])  # Exclude duplicate end node
        if not path_nodes.intersection(loop_nodes):
            non_touching_indices.append(i)
    
    # Create a subset of non-touching loops
    non_touching_loops = [loops[i] for i in non_touching_indices]
    
    # Create a mapping for non-touching loops if needed
    if loop_mapping:
        non_touching_mapping = {new_idx: loop_mapping[orig_idx] 
                               for new_idx, orig_idx in enumerate(non_touching_indices)}
        return calculate_determinant(G, non_touching_loops, non_touching_mapping)
    else:
        # Calculate determinant with just these non-touching loops
        return calculate_determinant(G, non_touching_loops)

def create_transfer_function_expression(G, forward_paths_info, loops, path_mapping, loop_mapping):
    """Create a symbolic transfer function expression using P1, P2, etc. and L1, L2, etc."""
    # Calculate path gains
    path_gains = []
    for i, path_info in enumerate(forward_paths_info):
        path = path_info["path"]
        edges_used = path_info.get("edges_used")
        gain = calculate_path_gain(G, path, edges_used)
        path_gains.append(gain)
    
    # Calculate the main determinant expression
    main_delta = calculate_determinant(G, loops, loop_mapping)
    
    # Calculate path determinants for each forward path
    path_determinants = []
    for path_info in forward_paths_info:
        path = path_info["path"]
        path_determinants.append(calculate_path_determinant(G, path, loops, loop_mapping))
    
    # Create the transfer function expression
    numerator_terms = []
    for i, (path_gain, path_det) in enumerate(zip(path_gains, path_determinants)):
        path_symbol = path_mapping[i]
        if isinstance(path_det, dict):  # If we have a symbolic expression
            if path_det["expression"] == "1":  # If determinant is 1
                numerator_terms.append(f"{path_symbol}")
            else:
                numerator_terms.append(f"{path_symbol}*({path_det['expression']})")
        else:
            if path_det == 1:  # If determinant is 1
                numerator_terms.append(f"{path_symbol}")
            else:
                numerator_terms.append(f"{path_symbol}*{path_det}")
    
    numerator_expr = " + ".join(numerator_terms)
    
    if isinstance(main_delta, dict):  # If we have a symbolic expression
        if main_delta["expression"] == "1":  # If main determinant is 1
            transfer_function_expr = numerator_expr
        else:
            transfer_function_expr = f"({numerator_expr})/({main_delta['expression']})"
    else:
        if main_delta == 1:  # If main determinant is 1
            transfer_function_expr = numerator_expr
        else:
            transfer_function_expr = f"({numerator_expr})/({main_delta})"
    
    # Also calculate the numeric value
    numeric_tf = 0
    for i, path_info in enumerate(forward_paths_info):
        path = path_info["path"]
        edges_used = path_info.get("edges_used")
        path_gain = calculate_path_gain(G, path, edges_used)
        path_det = calculate_path_determinant(G, path, loops)
        if isinstance(path_det, dict):
            path_det = path_det["numeric_value"]
        numeric_tf += path_gain * path_det
    
    numeric_delta = main_delta
    if isinstance(numeric_delta, dict):
        numeric_delta = numeric_delta["numeric_value"]
    
    if numeric_delta != 1:
        numeric_tf = numeric_tf / numeric_delta
    
    return {
        "expression": transfer_function_expr,
        "numeric_value": sp.simplify(numeric_tf)
    }

def calculate_transfer_function(G, forward_paths_info, loops, path_mapping=None, loop_mapping=None):
    """Calculate transfer function using Mason's Gain Formula"""
    if path_mapping and loop_mapping:
        return create_transfer_function_expression(G, forward_paths_info, loops, path_mapping, loop_mapping)
    
    # Calculate the main determinant (Δ)
    delta = calculate_determinant(G, loops)
    
    # Calculate the numerator terms (Pₖ × Δₖ)
    numerator = 0
    for path_info in forward_paths_info:
        path = path_info["path"]
        edges_used = path_info.get("edges_used")
        path_gain = calculate_path_gain(G, path, edges_used)
        path_determinant = calculate_path_determinant(G, path, loops)
        numerator += path_gain * path_determinant
    
    # Transfer function is T = (∑ Pₖ × Δₖ) / Δ
    if delta == 1:
        return sp.simplify(numerator)
    else:
        return sp.simplify(numerator / delta)


def calculate_forward_path_gains(G, paths_info, path_mapping=None):
    """Calculate gains for all forward paths with specific edges"""
    path_gains = []
    for i, path_info in enumerate(paths_info):
        path = path_info["path"]
        edges_used = path_info.get("edges_used")
        gain = calculate_path_gain(G, path, edges_used)
        path_id = path_mapping[i] if path_mapping else f"Path {i+1}"
        path_gains.append({
            "id": path_id,
            "path": path,
            "gain": str(gain)
        })
    return path_gains

def format_path_for_display(path):
    """Format a path as a string like S1->S2->S3"""
    return "->".join(path)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    nodes = data.get('nodes', [])
    edges = data.get('edges', [])
    source = data.get('sourceNode', 'S1')
    sink = data.get('destNode', 'S4')
    print(source)
    print(sink)

    G = build_graph(nodes, edges)
    draw_graph(G)

    # Find forward paths with edge information
    forward_paths_info = find_forward_paths(G, source, sink)
    
    # Extract just the paths for certain operations
    forward_paths = [info["path"] for info in forward_paths_info]

    loops ,loop_gains= find_unique_loops(G)
    print(loops)
    print(loop_gains)
    
    # Create mappings for paths and loops
    path_mapping = {i: f"P{i+1}" for i in range(len(forward_paths_info))}
    loop_mapping = {i: f"L{i+1}" for i in range(len(loops))}
    
    # Print paths with their labels
    print("\nForward Path Mapping:")
    for i, path_info in enumerate(forward_paths_info):
        print(f"{path_mapping[i]}: {format_path_for_display(path_info['path'])}")
    
    # Print loops with their labels
    print("\nLoop Mapping:")
    for i, loop in enumerate(loops):
        print(f"{loop_mapping[i]}: {format_path_for_display(loop[:-1] + [loop[-1]])}")

    # Calculate detailed information
    forward_path_gains = calculate_forward_path_gains(G, forward_paths_info, path_mapping)
     
    
    # Calculate determinant with symbolic mapping
    determinant = calculate_determinant(G, loops, loop_mapping)
    print(f"\nDeterminant (Δ): {determinant['expression'] if isinstance(determinant, dict) else determinant}")
    
    # Calculate path determinants
    path_determinants = []
    for i, path_info in enumerate(forward_paths_info):
        path = path_info["path"]
        delta_k = calculate_path_determinant(G, path, loops, loop_mapping)
        path_determinants.append({
            "path_id": path_mapping[i],
            "path": path,
            "determinant": delta_k['expression'] if isinstance(delta_k, dict) else str(delta_k)
        })
        print(f"Path Determinant for {path_mapping[i]}: {delta_k['expression'] if isinstance(delta_k, dict) else delta_k}")

    # Calculate transfer function with symbolic mapping
    transfer_function = calculate_transfer_function(G, forward_paths_info, loops, path_mapping, loop_mapping)
    if isinstance(transfer_function, dict):
        tf_expression = transfer_function["expression"]
        tf_numeric = str(transfer_function["numeric_value"])
    else:
        tf_expression = str(transfer_function)
        tf_numeric = str(transfer_function)
    print(f'\nTransfer Function: {tf_expression}')
    print(f'Numeric Value: {tf_numeric}')
    loop_gains_str = [str(gain) for gain in loop_gains]
    print("FFFFFF")
    print(loop_gains_str)

    analysis_result = {
        "forward_paths": [
            {
                "id": path_mapping[i],
                "nodes": path_info["path"],
                "display": format_path_for_display(path_info["path"])
            } for i, path_info in enumerate(forward_paths_info)
        ],
        "forward_path_gains": forward_path_gains,
        "loops": [
            {
                "id": loop_mapping[i],
                "nodes": loop,
                "display": format_path_for_display(loop[:-1] + [loop[-1]])
            } for i, loop in enumerate(loops)
        ],
        "loop_gains": loop_gains_str,
        "determinant": {
            "expression": determinant['expression'] if isinstance(determinant, dict) else str(determinant),
            "numeric_value": str(determinant['numeric_value'] if isinstance(determinant, dict) else determinant)
        },
        "path_determinants": path_determinants,
        "transfer_function": {
            "expression": tf_expression,
            "numeric_value": str(tf_numeric)
        }
    }

    return jsonify(result=analysis_result)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify(status="ok", message="Signal Flow Graph API is running")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)