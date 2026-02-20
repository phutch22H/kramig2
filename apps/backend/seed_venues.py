"""Seed the venues table with venues from dice.fm directory."""
import asyncio
import os
import re
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Venues data: (name, address, city, country)
VENUES = [
    # A
    ("100 Club", "100 Oxford Street, London, W1D 1LL", "London", "United Kingdom"),
    ("229 The Venue", "229 Great Portland Street, London, W1W 5PN", "London", "United Kingdom"),
    ("93 Feet East", "150 Brick Lane, London, E1 6QL", "London", "United Kingdom"),
    ("Ally Pally", "Alexandra Palace Way, London, N22 7AY", "London", "United Kingdom"),
    ("Alexandra Palace", "Alexandra Palace Way, London, N22 7AY", "London", "United Kingdom"),
    ("Omeara", "6 O'Meara Street, London, SE1 1TE", "London", "United Kingdom"),
    ("Academy Music Group", "211 Stockwell Road, London, SW9 9SL", "London", "United Kingdom"),
    # B
    ("Barbican Centre", "Silk Street, London, EC2Y 8DS", "London", "United Kingdom"),
    ("Band on the Wall", "25 Swan Street, Manchester, M4 5JZ", "Manchester", "United Kingdom"),
    ("Belgrave Music Hall", "1-1A Cross Belgrave Street, Leeds, LS2 8JP", "Leeds", "United Kingdom"),
    ("Bermondsey Social Club", "29 Enid Street, London, SE16 3RA", "London", "United Kingdom"),
    ("Bethnal Green Working Men's Club", "42-44 Pollard Row, London, E2 6NB", "London", "United Kingdom"),
    ("Birdcage", "74 Deansgate, Manchester, M3 2FN", "Manchester", "United Kingdom"),
    ("Blackheath Halls", "23 Lee Road, London, SE3 9RQ", "London", "United Kingdom"),
    ("Blazer", "1-5 Lexington Street, London, W1F 9AF", "London", "United Kingdom"),
    ("Boardmasters", "Watergate Bay, Cornwall, TR8 4AA", "Newquay", "United Kingdom"),
    ("Body&Soul Festival", "Ballinlough Castle, Co. Westmeath", "Westmeath", "Ireland"),
    ("Bold Tendencies", "Levels 7-10, Multi Storey Car Park, 95A Rye Lane, London, SE15 4ST", "London", "United Kingdom"),
    ("Boiler Room", "Various Locations", "London", "United Kingdom"),
    ("Brixton Academy", "211 Stockwell Road, London, SW9 9SL", "London", "United Kingdom"),
    ("Brixton Electric", "1 Town Hall Parade, London, SW2 1RJ", "London", "United Kingdom"),
    ("Brixton Jamm", "261 Brixton Road, London, SW9 6LH", "London", "United Kingdom"),
    ("Brixton Village", "Coldharbour Lane, London, SW9 8PR", "London", "United Kingdom"),
    ("Brixxton Windmill", "22 Blenheim Gardens, London, SW2 5BZ", "London", "United Kingdom"),
    ("Brudenell Social Club", "33 Queens Road, Leeds, LS6 1NY", "Leeds", "United Kingdom"),
    ("Bush Hall", "310 Uxbridge Road, London, W12 7LJ", "London", "United Kingdom"),
    # C
    ("Cafe OTO", "18-22 Ashwin Street, London, E8 3DL", "London", "United Kingdom"),
    ("Camden Assembly", "49 Chalk Farm Road, London, NW1 8AN", "London", "United Kingdom"),
    ("Camden Roundhouse", "Chalk Farm Road, London, NW1 8EH", "London", "United Kingdom"),
    ("Cargo", "83 Rivington Street, London, EC2A 3AY", "London", "United Kingdom"),
    ("Causes for Global Health", "Online", "London", "United Kingdom"),
    ("Cecil Sharp House", "2 Regent's Park Road, London, NW1 7AY", "London", "United Kingdom"),
    ("Clapham Grand", "21-25 St John's Hill, London, SW11 1TT", "London", "United Kingdom"),
    ("Clwb Ifor Bach", "11 Womanby Street, Cardiff, CF10 1BR", "Cardiff", "United Kingdom"),
    ("Club 85", "85 Hatton Garden, London, EC1N 8QR", "London", "United Kingdom"),
    ("Colour Factory", "8 Queen's Yard, London, E9 5EN", "London", "United Kingdom"),
    ("Concorde 2", "Madeira Drive, Brighton, BN2 1EN", "Brighton", "United Kingdom"),
    ("Corsica Studios", "4-5 Elephant Road, London, SE17 1LB", "London", "United Kingdom"),
    ("Courtyard Theatre", "Bowling Green Walk, London, N1 6HT", "London", "United Kingdom"),
    ("Crystal Palace Bowl", "Crystal Palace Park, London, SE19 1UB", "London", "United Kingdom"),
    # D
    ("DAZE", "Unit 7, 7-11 Minerva Street, London, E2 9EH", "London", "United Kingdom"),
    ("De La Warr Pavilion", "Marina, Bexhill On Sea, TN40 1DP", "Bexhill", "United Kingdom"),
    ("Depot Mayfield", "Baring Street, Manchester, M1 2PY", "Manchester", "United Kingdom"),
    ("Dingwalls", "Middle Yard, Camden Lock, London, NW1 8AB", "London", "United Kingdom"),
    ("Dolby Live", "3570 S Las Vegas Blvd, Las Vegas, NV 89109", "Las Vegas", "United States"),
    ("Dreamland Margate", "49-51 Marine Terrace, Margate, CT9 1XJ", "Margate", "United Kingdom"),
    ("Drumsheds", "Meridian Water, London, N18", "London", "United Kingdom"),
    # E
    ("E1 London", "110 Pennington Street, London, E1W 2BB", "London", "United Kingdom"),
    ("EartH (Evolutionary Arts Hackney)", "11-17 Stoke Newington Road, London, N16 8BH", "London", "United Kingdom"),
    ("Earth Hall", "11-17 Stoke Newington Road, London, N16 8BH", "London", "United Kingdom"),
    ("Edinburgh Festival Theatre", "13-29 Nicolson Street, Edinburgh, EH8 9FT", "Edinburgh", "United Kingdom"),
    ("Electric Ballroom", "184 Camden High Street, London, NW1 8QP", "London", "United Kingdom"),
    ("Electric Brixton", "1 Town Hall Parade, London, SW2 1RJ", "London", "United Kingdom"),
    ("Electrowerkz", "7 Torrens Street, London, EC1V 1NQ", "London", "United Kingdom"),
    ("Eventim Apollo", "45 Queen Caroline Street, London, W6 9QH", "London", "United Kingdom"),
    ("Exhibition London", "10A Western Gateway, London, E16 1DR", "London", "United Kingdom"),
    # F
    ("Fabric", "77A Charterhouse Street, London, EC1M 6HJ", "London", "United Kingdom"),
    ("Field Day", "Victoria Park, London, E3", "London", "United Kingdom"),
    ("Finsbury Park", "London, N4", "London", "United Kingdom"),
    ("Fire", "39 Parry Street, London, SW8 1RT", "London", "United Kingdom"),
    ("Flat Iron Square", "68 Union Street, London, SE1 1TD", "London", "United Kingdom"),
    ("Fold", "26 Badsworth Road, London, SE5 0JS", "London", "United Kingdom"),
    ("Forum Kentish Town", "9-17 Highgate Road, London, NW5 1JY", "London", "United Kingdom"),
    ("Future Yard", "76-78 Argyle Street, Birkenhead, CH41 6AF", "Birkenhead", "United Kingdom"),
    # G
    ("Garage", "20-22 Highbury Corner, London, N5 1RD", "London", "United Kingdom"),
    ("Glastonbury Festival", "Worthy Farm, Pilton, Somerset, BA4 4BY", "Pilton", "United Kingdom"),
    ("Gorilla", "54-56 Whitworth Street West, Manchester, M1 5WW", "Manchester", "United Kingdom"),
    ("Green Door Store", "2-4 Trafalgar Arches, Lower Goods Yard, Brighton, BN1 4FQ", "Brighton", "United Kingdom"),
    ("Grow Hackney", "Main Yard, Wallis Road, London, E9 5LN", "London", "United Kingdom"),
    # H
    ("Hackney Church", "11 Stoke Newington Road, London, N16 8BH", "London", "United Kingdom"),
    ("Hackney Empire", "291 Mare Street, London, E8 1EJ", "London", "United Kingdom"),
    ("HERE at Outernet", "Denmark Street, London, WC2H 0LA", "London", "United Kingdom"),
    ("Hidden", "232-236 Shoreditch High Street, London, E1 6PJ", "London", "United Kingdom"),
    ("Hootananny Brixton", "95 Effra Road, London, SW2 1DF", "London", "United Kingdom"),
    ("Hoxton Hall", "130 Hoxton Street, London, N1 6SH", "London", "United Kingdom"),
    # I
    ("ICA", "12 Carlton House Terrace, London, SW1Y 5AH", "London", "United Kingdom"),
    ("Islington Assembly Hall", "Upper Street, London, N1 2UD", "London", "United Kingdom"),
    # J
    ("Jazz Cafe", "5 Parkway, London, NW1 7PG", "London", "United Kingdom"),
    ("Junction 2", "Boston Manor Park, Brentford, TW8 9JR", "London", "United Kingdom"),
    # K
    ("KOKO", "1A Camden High Street, London, NW1 7JE", "London", "United Kingdom"),
    ("King Tut's Wah Wah Hut", "272A St Vincent Street, Glasgow, G2 5RL", "Glasgow", "United Kingdom"),
    ("Kings Place", "90 York Way, London, N1 9AG", "London", "United Kingdom"),
    # L
    ("La Scala", "100 Palomino Drive, London, N1 4JZ", "London", "United Kingdom"),
    ("Lafayette", "2 Baylis Road, London, SE1 7AA", "London", "United Kingdom"),
    ("Lighthouse", "28A Kingsland Road, London, E2 8DA", "London", "United Kingdom"),
    ("London Stadium", "Queen Elizabeth Olympic Park, London, E20 2ST", "London", "United Kingdom"),
    ("Lost Horizon", "Mead Street, Bristol, BS1 6LB", "Bristol", "United Kingdom"),
    ("Lovebox", "Gunnersbury Park, London, W3 8LQ", "London", "United Kingdom"),
    # M
    ("Magazine London", "Greenwich Peninsula, London, SE10 0QJ", "London", "United Kingdom"),
    ("Manchester Academy", "Oxford Road, Manchester, M13 9PR", "Manchester", "United Kingdom"),
    ("MOTH Club", "Old Trades Hall, Valette Street, London, E9 6NU", "London", "United Kingdom"),
    ("Motion Bristol", "74 Avon Street, Bristol, BS2 0PX", "Bristol", "United Kingdom"),
    ("Moles", "14 George Street, Bath, BA1 2EN", "Bath", "United Kingdom"),
    ("Moth Club", "Old Trades Hall, Valette Street, London, E9 6NU", "London", "United Kingdom"),
    ("Mighty Hoopla", "Brockwell Park, London, SE24", "London", "United Kingdom"),
    ("Ministry of Sound", "103 Gaunt Street, London, SE1 6DP", "London", "United Kingdom"),
    ("Moth Club", "Old Trades Hall, Valette Street, London, E9 6NU", "London", "United Kingdom"),
    ("Music Hall of Williamsburg", "66 North 6th Street, Brooklyn, NY 11249", "New York", "United States"),
    # N
    ("Night Tales", "14-18 Bohemia Place, London, E8 1DU", "London", "United Kingdom"),
    ("Nottingham Rock City", "8 Talbot Street, Nottingham, NG1 5GG", "Nottingham", "United Kingdom"),
    ("Notting Hill Arts Club", "21 Notting Hill Gate, London, W11 3JQ", "London", "United Kingdom"),
    ("NOW Building", "25 Churchill Place, London, E14 5RB", "London", "United Kingdom"),
    ("Nambucca", "596 Holloway Road, London, N7 6LB", "London", "United Kingdom"),
    # O
    ("O2 Academy Brixton", "211 Stockwell Road, London, SW9 9SL", "London", "United Kingdom"),
    ("O2 Academy Birmingham", "16 Horsefair, Bristol Street, Birmingham, B1 1DB", "Birmingham", "United Kingdom"),
    ("O2 Academy Islington", "N1 Centre, 16 Parkfield Street, London, N1 0PS", "London", "United Kingdom"),
    ("O2 Academy Leeds", "55 Cookridge Street, Leeds, LS2 3AW", "Leeds", "United Kingdom"),
    ("O2 Academy Liverpool", "11-13 Hotham Street, Liverpool, L3 5UF", "Liverpool", "United Kingdom"),
    ("O2 Academy Glasgow", "121 Eglinton Street, Glasgow, G5 9NT", "Glasgow", "United Kingdom"),
    ("O2 Academy Sheffield", "33-37 Arundel Gate, Sheffield, S1 2PN", "Sheffield", "United Kingdom"),
    ("O2 Forum Kentish Town", "9-17 Highgate Road, London, NW5 1JY", "London", "United Kingdom"),
    ("O2 Shepherd's Bush Empire", "Shepherd's Bush Green, London, W12 8TT", "London", "United Kingdom"),
    ("O2 Arena", "Peninsula Square, London, SE10 0DX", "London", "United Kingdom"),
    ("Oval Space", "29-32 The Oval, London, E2 9DT", "London", "United Kingdom"),
    ("Outernet London", "Denmark Street, London, WC2H 0LA", "London", "United Kingdom"),
    ("Oslo Hackney", "1A Amhurst Road, London, E8 1LL", "London", "United Kingdom"),
    # P
    ("Patterns", "10 Marine Parade, Brighton, BN2 1TL", "Brighton", "United Kingdom"),
    ("Phonox", "418 Brixton Road, London, SW9 7AY", "London", "United Kingdom"),
    ("Pickle Factory", "13-14 The Oval, London, E2 9DT", "London", "United Kingdom"),
    ("Peckham Audio", "133 Rye Lane, London, SE15 4ST", "London", "United Kingdom"),
    ("Pizza Express Jazz Club", "10 Dean Street, London, W1D 3RW", "London", "United Kingdom"),
    ("Printworks London", "Surrey Quays Road, London, SE16 7PJ", "London", "United Kingdom"),
    # Q
    ("Queen Elizabeth Hall", "Southbank Centre, London, SE1 8XX", "London", "United Kingdom"),
    # R
    ("Rich Mix", "35-47 Bethnal Green Road, London, E1 6LA", "London", "United Kingdom"),
    ("Rinse FM Studio", "Malt Building, London, SE1 2AU", "London", "United Kingdom"),
    ("Roundhouse", "Chalk Farm Road, London, NW1 8EH", "London", "United Kingdom"),
    ("Royal Albert Hall", "Kensington Gore, London, SW7 2AP", "London", "United Kingdom"),
    ("Royal Festival Hall", "Southbank Centre, London, SE1 8XX", "London", "United Kingdom"),
    # S
    ("Sage Gateshead", "St Mary's Square, Gateshead, NE8 2JR", "Gateshead", "United Kingdom"),
    ("Scala", "275 Pentonville Road, London, N1 9NL", "London", "United Kingdom"),
    ("Sebright Arms", "31-35 Coate Street, London, E2 9AG", "London", "United Kingdom"),
    ("Shangri-La", "Worthy Farm, Pilton, Somerset", "Pilton", "United Kingdom"),
    ("SJM Concerts", "Various Locations, Manchester", "Manchester", "United Kingdom"),
    ("SWG3", "100 Eastvale Place, Glasgow, G3 8QG", "Glasgow", "United Kingdom"),
    ("Somerset House", "Strand, London, WC2R 1LA", "London", "United Kingdom"),
    ("Southbank Centre", "Belvedere Road, London, SE1 8XX", "London", "United Kingdom"),
    ("St John at Hackney Church", "Lower Clapton Road, London, E5 0PD", "London", "United Kingdom"),
    ("Strange Brew", "12 Fairfax Street, Bristol, BS1 3BB", "Bristol", "United Kingdom"),
    ("Studio 338", "338 Boord Street, London, SE10 0PF", "London", "United Kingdom"),
    ("Studio 9294", "92-94 Wallis Road, London, E9 5LN", "London", "United Kingdom"),
    ("Sub Club", "22 Jamaica Street, Glasgow, G1 4QD", "Glasgow", "United Kingdom"),
    ("Subterania", "12 Acklam Road, London, W10 5QZ", "London", "United Kingdom"),
    ("Summer Sundae", "De Montfort Hall, Granville Road, Leicester, LE1 7RU", "Leicester", "United Kingdom"),
    # T
    ("The 100 Club", "100 Oxford Street, London, W1D 1LL", "London", "United Kingdom"),
    ("The Albany", "Douglas Way, Deptford, London, SE8 4AG", "London", "United Kingdom"),
    ("The Barbican", "Silk Street, London, EC2Y 8DS", "London", "United Kingdom"),
    ("The Black Chapel", "1A Ravenscroft Street, London, E2 7QG", "London", "United Kingdom"),
    ("The Boileroom", "13 Stoke Road, Guildford, GU1 4HP", "Guildford", "United Kingdom"),
    ("The Borderline", "Orange Yard, London, W1D 4JB", "London", "United Kingdom"),
    ("The Dome", "2A Dartmouth Park Hill, London, NW5 1HL", "London", "United Kingdom"),
    ("The Dome Brighton", "29 New Road, Brighton, BN1 1UG", "Brighton", "United Kingdom"),
    ("The Esperance", "1 Esperance Walk, London, SW3 3LB", "London", "United Kingdom"),
    ("The Fleece", "12 St Thomas Street, Bristol, BS1 6JJ", "Bristol", "United Kingdom"),
    ("The Garage", "20-22 Highbury Corner, London, N5 1RD", "London", "United Kingdom"),
    ("The George Tavern", "373 Commercial Road, London, E1 0LA", "London", "United Kingdom"),
    ("The Grand Social", "35 Lower Liffey Street, Dublin 1", "Dublin", "Ireland"),
    ("The Hackney Social", "270 Mare Street, London, E8 1HE", "London", "United Kingdom"),
    ("The Haunt", "10 Pool Valley, Brighton, BN1 1NJ", "Brighton", "United Kingdom"),
    ("The Jazz Cafe", "5 Parkway, London, NW1 7PG", "London", "United Kingdom"),
    ("The Leadmill", "6-7 Leadmill Road, Sheffield, S1 4SE", "Sheffield", "United Kingdom"),
    ("The Lexington", "96-98 Pentonville Road, London, N1 9JB", "London", "United Kingdom"),
    ("The Louisiana", "Wapping Road, Bristol, BS1 4RH", "Bristol", "United Kingdom"),
    ("The Lower Third", "49 Chalk Farm Road, London, NW1 8AN", "London", "United Kingdom"),
    ("The Moth Club", "Old Trades Hall, Valette Street, London, E9 6NU", "London", "United Kingdom"),
    ("The Neighbourhood", "2 Earlham Street, London, WC2H 9LN", "London", "United Kingdom"),
    ("The Old Blue Last", "38 Great Eastern Street, London, EC2A 3ES", "London", "United Kingdom"),
    ("The Pickle Factory", "13-14 The Oval, London, E2 9DT", "London", "United Kingdom"),
    ("The Shacklewell Arms", "71 Shacklewell Lane, London, E8 2EB", "London", "United Kingdom"),
    ("The Social", "5 Little Portland Street, London, W1W 7JD", "London", "United Kingdom"),
    ("The Steelyard", "13 Hope Street, Liverpool, L1 9BQ", "Liverpool", "United Kingdom"),
    ("The Victoria", "451 Queensbridge Road, London, E8 3AS", "London", "United Kingdom"),
    ("The Waiting Room", "175 Stoke Newington High Street, London, N16 0LH", "London", "United Kingdom"),
    ("The Windmill Brixton", "22 Blenheim Gardens, London, SW2 5BZ", "London", "United Kingdom"),
    ("The Wylam Brewery", "Palace of Arts, Exhibition Park, Newcastle, NE2 4PZ", "Newcastle", "United Kingdom"),
    ("Tobacco Dock", "Tobacco Quay, Wapping Lane, London, E1W 2SF", "London", "United Kingdom"),
    ("Todmorden", "Central Vale, Todmorden, OL14 5QS", "Todmorden", "United Kingdom"),
    ("Tramshed Cardiff", "Clare Road, Cardiff, CF11 6QP", "Cardiff", "United Kingdom"),
    ("Trades Club Hebden Bridge", "Holme Street, Hebden Bridge, HX7 8EE", "Hebden Bridge", "United Kingdom"),
    ("Trinity Centre Bristol", "Trinity Road, Bristol, BS2 0NW", "Bristol", "United Kingdom"),
    ("Tufnell Park Dome", "178 Junction Road, London, N19 5QQ", "London", "United Kingdom"),
    # U
    ("Under the Bridge", "Stamford Bridge, Fulham Road, London, SW6 1HS", "London", "United Kingdom"),
    ("Underbelly Festival", "Southbank Centre, London, SE1 8XX", "London", "United Kingdom"),
    ("Union Chapel", "Compton Terrace, London, N1 2UN", "London", "United Kingdom"),
    # V
    ("Vaults", "Leake Street, London, SE1 7NN", "London", "United Kingdom"),
    ("Victoria Park", "Grove Road, London, E3 5TB", "London", "United Kingdom"),
    ("Village Underground", "54 Holywell Lane, London, EC2A 3PQ", "London", "United Kingdom"),
    ("Voxhall", "Klosterport 4A, 8000 Aarhus C", "Aarhus", "Denmark"),
    # W
    ("Warehouse Project", "Store Street, Manchester, M1 2WA", "Manchester", "United Kingdom"),
    ("Wembley Arena", "Arena Square, Engineers Way, London, HA9 0AA", "London", "United Kingdom"),
    ("Wembley Stadium", "Wembley, London, HA9 0WS", "London", "United Kingdom"),
    ("Werkhaus", "E2 9DT, London", "London", "United Kingdom"),
    ("Wide Awake Festival", "Brockwell Park, London, SE24", "London", "United Kingdom"),
    ("Windmill Brixton", "22 Blenheim Gardens, London, SW2 5BZ", "London", "United Kingdom"),
    ("Wire Club Leeds", "33-35 Call Lane, Leeds, LS1 7BT", "Leeds", "United Kingdom"),
    ("WHP", "Victoria Warehouse, Trafford Wharf Road, Manchester, M17 1AB", "Manchester", "United Kingdom"),
    # X
    ("XOYO", "32-37 Cowper Street, London, EC2A 4AP", "London", "United Kingdom"),
    # Y
    ("YES Manchester", "38 Charles Street, Manchester, M1 7DB", "Manchester", "United Kingdom"),
    ("Yard", "Unit 2a, Queen's Yard, London, E9 5EN", "London", "United Kingdom"),
    # Z
    ("Zinc", "36 Galena Road, London, W6 0LT", "London", "United Kingdom"),
    # Additional well-known UK & international venues
    ("Barrowland Ballroom", "244 Gallowgate, Glasgow, G4 0TT", "Glasgow", "United Kingdom"),
    ("The Troxy", "490 Commercial Road, London, E1 0HX", "London", "United Kingdom"),
    ("Heaven", "Under the Arches, Villiers Street, London, WC2N 6NG", "London", "United Kingdom"),
    ("Hammersmith Apollo", "45 Queen Caroline Street, London, W6 9QH", "London", "United Kingdom"),
    ("The SSE Hydro", "Exhibition Way, Glasgow, G3 8YW", "Glasgow", "United Kingdom"),
    ("Motorpoint Arena Cardiff", "Mary Ann Street, Cardiff, CF10 2EQ", "Cardiff", "United Kingdom"),
    ("Manchester Arena", "Victoria Station Approach, Manchester, M3 1AR", "Manchester", "United Kingdom"),
    ("Resorts World Arena", "Pendigo Way, Birmingham, B40 1NT", "Birmingham", "United Kingdom"),
    ("First Direct Arena", "Arena Way, Leeds, LS2 8BY", "Leeds", "United Kingdom"),
    ("Utilita Arena Newcastle", "Arena Way, Newcastle, NE4 7NA", "Newcastle", "United Kingdom"),
    ("Brighton Centre", "Kings Road, Brighton, BN1 2GR", "Brighton", "United Kingdom"),
    ("Corn Exchange", "86 New Street, Cambridge, CB5 8BB", "Cambridge", "United Kingdom"),
    ("The Bullingdon", "162 Cowley Road, Oxford, OX4 1UE", "Oxford", "United Kingdom"),
    ("Thekla", "East Mud Dock, The Grove, Bristol, BS1 4RB", "Bristol", "United Kingdom"),
    ("Concorde 2", "Madeira Shelter Hall, Madeira Drive, Brighton, BN2 1EN", "Brighton", "United Kingdom"),
    ("Rescue Rooms", "25 Goldsmith Street, Nottingham, NG1 5JT", "Nottingham", "United Kingdom"),
    ("Arts Club Liverpool", "90 Seel Street, Liverpool, L1 4BH", "Liverpool", "United Kingdom"),
    ("The Institute", "78 Digbeth, Birmingham, B5 6DY", "Birmingham", "United Kingdom"),
    ("Mama Roux's", "Lower Trinity Street, Digbeth, Birmingham, B9 4AG", "Birmingham", "United Kingdom"),
    ("Hare & Hounds", "106 High Street, Kings Heath, Birmingham, B14 7JZ", "Birmingham", "United Kingdom"),
    ("Baba Yaga's Hut", "Bethnal Green Rd, London, E2", "London", "United Kingdom"),
    ("Dalston Superstore", "117 Kingsland High Street, London, E8 2PB", "London", "United Kingdom"),
    ("Total Refreshment Centre", "76 Stoke Newington Road, London, N16 7XB", "London", "United Kingdom"),
    ("The Lexington", "96-98 Pentonville Road, London, N1 9JB", "London", "United Kingdom"),
    ("Peckham Levels", "95A Rye Lane, London, SE15 4ST", "London", "United Kingdom"),
    ("Night Owl", "17-18 Lower Severn Street, Birmingham, B1 1PU", "Birmingham", "United Kingdom"),
    ("Hockley Social Club", "72 High Street, Birmingham, B18 6HN", "Birmingham", "United Kingdom"),
    ("The Cluny", "36 Lime Street, Ouseburn, Newcastle, NE1 2PQ", "Newcastle", "United Kingdom"),
    ("Riverside Newcastle", "Melbourne Street, Newcastle, NE1 2JQ", "Newcastle", "United Kingdom"),
    ("The Lemon Tree", "5 West North Street, Aberdeen, AB24 5AT", "Aberdeen", "United Kingdom"),
    ("The Bongo Club", "66 Cowgate, Edinburgh, EH1 1JX", "Edinburgh", "United Kingdom"),
    ("Sneaky Pete's", "73 Cowgate, Edinburgh, EH1 1JW", "Edinburgh", "United Kingdom"),
    ("La Belle Angele", "11 Hasties Close, Edinburgh, EH1 1HJ", "Edinburgh", "United Kingdom"),
    ("The Liquid Room", "9C Victoria Street, Edinburgh, EH1 2HE", "Edinburgh", "United Kingdom"),
    ("Mono", "12 Kings Court, Glasgow, G1 5RB", "Glasgow", "United Kingdom"),
    ("Stereo", "22-28 Renfield Lane, Glasgow, G2 6PH", "Glasgow", "United Kingdom"),
    ("Nice N Sleazy", "421 Sauchiehall Street, Glasgow, G2 3LG", "Glasgow", "United Kingdom"),
    ("Art School Glasgow", "20 Scott Street, Glasgow, G3 6PE", "Glasgow", "United Kingdom"),
    ("Whelan's", "25 Wexford Street, Dublin 2", "Dublin", "Ireland"),
    ("Vicar Street", "58-59 Thomas Street, Dublin 8", "Dublin", "Ireland"),
    ("3Arena", "North Wall Quay, Dublin 1", "Dublin", "Ireland"),
    ("Olympia Theatre Dublin", "72 Dame Street, Dublin 2", "Dublin", "Ireland"),
    ("Button Factory", "Curved Street, Temple Bar, Dublin 2", "Dublin", "Ireland"),
    ("Berghain", "Am Wriezener Bahnhof, 10243 Berlin", "Berlin", "Germany"),
    ("Tresor", "Kopenicker Str. 70, 10179 Berlin", "Berlin", "Germany"),
    ("Watergate", "Falckensteinstrasse 49, 10997 Berlin", "Berlin", "Germany"),
    ("Sisyphos", "Hauptstrasse 18, 10317 Berlin", "Berlin", "Germany"),
    ("De School", "Dr. Jan van Breemenstraat 1, 1056 AB Amsterdam", "Amsterdam", "Netherlands"),
    ("Shelter Amsterdam", "Overhoeksplein 3, 1031 KS Amsterdam", "Amsterdam", "Netherlands"),
    ("Paradiso", "Weteringschans 6-8, 1017 SG Amsterdam", "Amsterdam", "Netherlands"),
    ("Melkweg", "Lijnbaansgracht 234A, 1017 PH Amsterdam", "Amsterdam", "Netherlands"),
    ("Rex Club", "5 Boulevard Poissonniere, 75002 Paris", "Paris", "France"),
    ("Concrete Paris", "69 Port de la Rapee, 75012 Paris", "Paris", "France"),
    ("La Gaite Lyrique", "3bis Rue Papin, 75003 Paris", "Paris", "France"),
    ("Razzmatazz", "Carrer dels Almogavers 122, 08018 Barcelona", "Barcelona", "Spain"),
    ("Sala Apolo", "Carrer Nou de la Rambla 113, 08004 Barcelona", "Barcelona", "Spain"),
    ("Lux Fragil", "Av. Infante Dom Henrique, 1900-264 Lisboa", "Lisbon", "Portugal"),
    ("Nuits Sonores", "Various Locations, Lyon", "Lyon", "France"),
    ("Dekmantel Festival", "Amsterdamse Bos, Amsterdam", "Amsterdam", "Netherlands"),
    ("Sonar Festival", "Various Locations, Barcelona", "Barcelona", "Spain"),
    ("Primavera Sound", "Parc del Forum, Barcelona", "Barcelona", "Spain"),
    ("Webster Hall", "125 East 11th Street, New York, NY 10003", "New York", "United States"),
    ("Brooklyn Steel", "319 Frost Street, Brooklyn, NY 11222", "New York", "United States"),
    ("Terminal 5", "610 West 56th Street, New York, NY 10019", "New York", "United States"),
    ("Elsewhere", "599 Johnson Avenue, Brooklyn, NY 11237", "New York", "United States"),
    ("Avant Gardner", "140 Stewart Avenue, Brooklyn, NY 11237", "New York", "United States"),
    ("Baby's All Right", "146 Broadway, Brooklyn, NY 11211", "New York", "United States"),
    ("The Roxy", "515 West 18th Street, New York, NY 10011", "New York", "United States"),
    ("House of Blues", "329 N Dearborn Street, Chicago, IL 60654", "Chicago", "United States"),
    ("The Fillmore", "1805 Geary Blvd, San Francisco, CA 94115", "San Francisco", "United States"),
    ("The Wiltern", "3790 Wilshire Blvd, Los Angeles, CA 90010", "Los Angeles", "United States"),
    ("The Fonda Theatre", "6126 Hollywood Blvd, Los Angeles, CA 90028", "Los Angeles", "United States"),
    ("El Rey Theatre", "5515 Wilshire Blvd, Los Angeles, CA 90036", "Los Angeles", "United States"),
    ("Echoplex", "1154 Glendale Blvd, Los Angeles, CA 90026", "Los Angeles", "United States"),
    ("9:30 Club", "815 V Street NW, Washington, DC 20001", "Washington DC", "United States"),
    ("Red Rocks Amphitheatre", "18300 W Alameda Pkwy, Morrison, CO 80465", "Morrison", "United States"),
    ("Fox Theater Oakland", "1807 Telegraph Avenue, Oakland, CA 94612", "Oakland", "United States"),
    ("Showbox Seattle", "1426 1st Avenue, Seattle, WA 98101", "Seattle", "United States"),
    ("Doug Fir Lounge", "830 E Burnside Street, Portland, OR 97214", "Portland", "United States"),
]


def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


async def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not set")
        return

    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(db_url)

    async with engine.begin() as conn:
        # Create table if not exists
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS venues (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL UNIQUE,
                address TEXT,
                city VARCHAR(255),
                country VARCHAR(255),
                image_url TEXT,
                capacity INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_venues_name ON venues (name)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_venues_slug ON venues (slug)"))

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    created = 0
    skipped = 0
    seen_slugs = set()

    async with async_session() as session:
        for name, address, city, country in VENUES:
            slug = slugify(name)
            if not slug or slug in seen_slugs:
                skipped += 1
                continue
            seen_slugs.add(slug)

            result = await session.execute(
                text("SELECT id FROM venues WHERE slug = :slug"), {"slug": slug}
            )
            if result.scalar_one_or_none():
                skipped += 1
                continue

            await session.execute(
                text("""
                    INSERT INTO venues (id, name, slug, address, city, country)
                    VALUES (:id, :name, :slug, :address, :city, :country)
                """),
                {"id": str(uuid.uuid4()), "name": name, "slug": slug, "address": address, "city": city, "country": country},
            )
            created += 1

        await session.commit()

    await engine.dispose()
    print(f"Done! Created {created}, skipped {skipped} (total entries: {len(VENUES)})")


if __name__ == "__main__":
    asyncio.run(main())
