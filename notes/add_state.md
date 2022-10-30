LIB.RS

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    borsh::try_from_slice_unchecked,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    pubkey::Pubkey,
    system_instruction,
    // program_error::ProgramError,
    sysvar::{rent::Rent, Sysvar},
};
use std::convert::TryInto;

pub mod instruction;
use instruction::MovieInstruction;
// 19. import new file and struct
pub mod state;
use borsh::{BorshDeserialize, BorshSerialize};
use state::MovieAccountState;

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = MovieInstruction::unpack(instruction_data)?;
    match instruction {
        MovieInstruction::AddMovieReview {
            title,
            rating,
            description,
        } => add_movie_review(program_id, accounts, title, rating, description),
    }
}

pub fn add_movie_review(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    title: String,
    rating: u8,
    description: String,
) -> ProgramResult {
    msg!("Adding movie review...");
    msg!("Title: {}", title);
    msg!("Rating: {}", rating);
    msg!("Description: {}", description);

    // 20. add iterator -- Get Account Iterator
    let account_info_iter = &mut accounts.iter();

    // 21. pass in necessary data one by one using iterator method of next account info -- Get Accounts
    // order we use here, is set and the client side will need to match that
    let initializer = next_account_info(account_info_iter)?;
    let pda_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    // 22. derive pda, even though it's above, we need the bump seed, hence this code -- Derice PDA and check that it matches client
    let (pda, bump_seed) = Pubkey::find_program_address(
        &[initializer.key.as_ref(), title.as_bytes().as_ref()],
        program_id,
    );

    // 23. calculate space required, it is fairly often to have this as part of account struct, but for learning, we're doing it seprately
    // first 1 is for is initiazlie, next 1 is for rating, then add vartiable length items
    let account_len: usize = 1 + 1 + (4 + title.len()) + (4 + description.len());

    // 24. calculate rent
    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(account_len);

    // 25. call to system program to create account -- Create the Account
    invoke_signed(
        &system_instruction::create_account(
            // payer
            initializer.key,
            // address of new account
            pda_account.key,
            // rent
            rent_lamports,
            // account in right format
            account_len.try_into().unwrap(),
            // program id
            program_id,
        ),
        // above is instruction, then pass in accounts to derive that pda
        &[
            initializer.clone(),
            pda_account.clone(),
            system_program.clone(),
        ],
        // then the seeds
        // reference to an array whose items are also a reference to an array of byte arrays
        // two nested arrays inside of an array
        &[&[
            initializer.key.as_ref(),
            title.as_bytes().as_ref(),
            &[bump_seed],
        ]],
    )?;

    msg!("PDA created: {}", pda);

    // 26. now that we have a created account at the above pda address, we can take that data and deserealize as our movie struct
    msg!("unpacking state account");
    let mut account_data =
        try_from_slice_unchecked::<MovieAccountState>(&pda_account.data.borrow()).unwrap();
    msg!("borrowed account data");
    account_data.title = title;
    account_data.rating = rating;
    account_data.description = description;
    account_data.is_initialized = true;

    // 27. serialize account
    msg!("serializing account data");
    account_data.serialize(&mut &mut pda_account.data.borrow_mut()[..])?;
    msg!("state account serialized");

    Ok(())
}


// 28. build
// 29. deploy
// 30. copy program id
// 31. open up front end project, go to form.tsx chance movie review program id, also make same change in movie coordinator
// 32. make sure you do npm install
// 33. npm run dev

// found error in how state was created, made change, which was a breaking change, so had to
// 34. go into program credential under build, his 'new' which generates a new program id
// 35. build and deploy again


INSTRUCTION.RS (same as before)

use borsh::{BorshDeserialize};
use solana_program::{program_error::ProgramError};

pub enum MovieInstruction {
  AddMovieReview {
    title: String,
    rating: u8,
    description: String
  }
}

#[derive(BorshDeserialize)]
struct MovieReviewPayload {
  title: String,
  rating: u8,
  description: String
}

impl MovieInstruction {
  pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&variant, rest) = input.split_first().ok_or(ProgramError::InvalidInstructionData)?;
        let payload = MovieReviewPayload::try_from_slice(rest).unwrap();
        Ok(match variant {
            0 => Self::AddMovieReview { title: payload.title, rating: payload.rating, description: payload.description },
            _ => return Err(ProgramError::InvalidInstructionData)
        })
    }
}

STATE.RS (new)

// 15. create this new file state.rs
// 16. imports

use borsh::{BorshDeserialize, BorshSerialize};

// 17. create struct to represent movie object
// order is different than movie instruction struct, reason being, it's easier to search by static data, so we put that stuff first
// 18. add derives

#[derive(BorshSerialize, BorshDeserialize)]
pub struct MovieAccountState {
    pub is_initialized: bool,
    pub rating: u8,
    pub title: String,
    pub description: String,
}
