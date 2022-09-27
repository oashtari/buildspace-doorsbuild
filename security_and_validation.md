// 1. lib rs only has mod's in it, moved entrypoint into its own file
// 2. entrypoins is the most basic solana stuff, plus the processor file (which is new)
// 3. in processor file, everything is as before, but we're now using a fixed size of 1000 for account len as we're going to need to update reviews and such
// 4. state file has two additions
// 4a. Sealed trait, which is related to constant size of account len of 1000, which allows for compiler optimizations when the size of the account is known
// 4b. is_initialized is just an easy way to access whether an account is initialized 
// 5. error file is empty, now we'll create custom errors

ERROR.RS

// try to update account that does not exist
// pda passed in does not match derived (expected) pda
// input data is larger than program allows
// rating does not fall in 1-5 range

// 6. imports 
use solana_program::{program_error::ProgramError};
use thiserror::Error;

// 7. review error enum -- put #[error] in front of each enum variant is making them actual error types and giving them error messages
#[derive(Debug, Error)]
pub enum ReviewError {
    #[error("Account not initialized.")]
    UninitializedAccount,
    
    #[error("Derived PDA does not match passed in PDA.")]
    InvalidPDA,
    
    #[error("Input data exceeds max length.")]
    InvalidDataLength,

    #[error("Rating greater than 5 or less than 1")]
    InvalidRating,
}

// 8. we have review error, need to turn it into a program error with an impl 

impl From<ReviewError> for ProgramError {
    fn from(e: ReviewError) -> Self {// this self is ProgramError here
        ProgramError::Custom(e as u32) // either leave off semicolon or make explicit as below
        // return ProgramError::Custom(e as u32); 
    }
}

INSTRUCTION.RS

use borsh::{BorshDeserialize};
use solana_program::{program_error::ProgramError};

pub enum MovieInstruction {
  AddMovieReview {
    title: String,
    rating: u8,
    description: String
  },
    
// 18. add new variant for updating movie -- can use same payload struct
    UpdateMovieReview {
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
            // 19. changing unpack function so it has multiple instructions 
            1 => Self::UpdateMovieReview {title: payload.title, rating: payload.rating, description: payload.description},
            _ => return Err(ProgramError::InvalidInstructionData)
        })
    }
}

PROCESSOR.RS

use solana_program::{
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
    account_info::{next_account_info, AccountInfo},
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
    program::{invoke_signed},
    borsh::try_from_slice_unchecked,
    program_error::ProgramError,
    // 16. import this 
    program_pack::{IsInitialized}, // this is trait we added to our state files
};
use std::convert::TryInto;
use borsh::BorshSerialize;
use crate::instruction::MovieInstruction;
use crate::state::MovieAccountState;
// 10. import errors we built 
use crate::error::ReviewError;

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
  ) -> ProgramResult {
    let instruction = MovieInstruction::unpack(instruction_data)?;
    match instruction {
      MovieInstruction::AddMovieReview { title, rating, description } => {
        add_movie_review(program_id, accounts, title, rating, description)
      },
        // 20. need to update this match statement with the instruction match statement for MovieInstruction 
        MovieInstruction::UpdateMovieReview { title, rating, description } => {
            update_movie_review(program_id, accounts, title, rating, description)
        }
    }
  }

  pub fn add_movie_review(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    title: String,
    rating: u8,
    description: String
  ) -> ProgramResult {
    msg!("Adding movie review...");
    msg!("Title: {}", title);
    msg!("Rating: {}", rating);
    msg!("Description: {}", description);

    let account_info_iter = &mut accounts.iter();

    let initializer = next_account_info(account_info_iter)?;
    let pda_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    // 11. add a signer check 
    if !initializer.is_signer {
        msg!("Missing required signature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // 12. check if correct PDA is passed in -- -- THIS IS ACTUALLY NOT NECESSARY AS PDA ACCOUNT HAS NOT BEEN CREATED YET
    // if pda_account.owner != program_id {
    //     return Err(ProgramError::IllegalOwner);
    // }

    let (pda, bump_seed) = Pubkey::find_program_address(&[initializer.key.as_ref(), title.as_bytes().as_ref(),], program_id);

    // 13. now check if corredt PDA 
    if pda != *pda_account.key {
        msg!("Ivalid seeds for PDA");
        return Err(ProgramError::InvalidArgument);
    }

    // 14. check if rating is between 1 and 5 -- this is first time we're using one of our errors
    if rating < 1 || rating > 5 {
        msg!("Rating must be between 1 and 5");
        return Err(ReviewError::InvalidRating.into()); // the .into is what converts it from a review error to a program error, it's the implementatino of the from function we created in the error file
    }

    // 15. check to see if total size of data we're passing in does not exceed the account length 
    let total_len: usize = 1 + 1 + (4 + title.len()) + (4 + description.len());
    
    let account_len = 1000;

    if total_len > account_len {
        msg!("Data length is larger than 1000 bytes");
        return Err(ReviewError::InvalidDataLength.into());
    }

    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(account_len);

    invoke_signed(
      &system_instruction::create_account(
        initializer.key,
        pda_account.key,
        rent_lamports,
        account_len.try_into().unwrap(),
        program_id,
      ),
      &[initializer.clone(), pda_account.clone(), system_program.clone()],
      &[&[initializer.key.as_ref(), title.as_bytes().as_ref(), &[bump_seed]]],
    )?;

    msg!("PDA created: {}", pda);

    msg!("unpacking state account");
    let mut account_data = try_from_slice_unchecked::<MovieAccountState>(&pda_account.data.borrow()).unwrap();
    msg!("borrowed account data");

    // 17. check to see if initialized 
    if account_data.is_initialized() {
        msg!("Account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized);
    }
    account_data.title = title;
    account_data.rating = rating;
    account_data.description = description;
    account_data.is_initialized = true;

    msg!("serializing account");
    account_data.serialize(&mut &mut pda_account.data.borrow_mut()[..])?;
    msg!("state account serialized");

    Ok(())
  }

// 21. implement update_movie_review function, going to build error handling in real-time 
pub fn update_movie_review (
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _title: String,
    rating: u8,
    description: String,
) -> ProgramResult {
    msg!("updating moview review..."); // basically leaving breadcumbs to make sure things are progressing

    // 22. iterate through accounts 
    let account_info_iter = &mut accounts.iter();

    // 23. now we can get various account info -- only need these two this time, not system program as we're just updating an existing account, not creating a new one
    let initializer = next_account_info(account_info_iter)?;
    let pda_account = next_account_info(account_info_iter)?;

    // 24. quick owner check 
    if pda_account.owner != program_id {
        return Err(ProgramError::IllegalOwner);   
    }

    // 25. signer check
    if !initializer.is_signer {
        msg!("missing required signature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // 26. unpack pda account 
    msg!("unpacking state account");

    let mut account_data = try_from_slice_unchecked::<MovieAccountState>(&pda_account.data.borrow()).unwrap();
    msg!("borrowed account data");

    // 27. account validation -- passing in an array of 2 seeds, then program id after the array
    // we're not using title so we don't screw up the movie title
    let (pda, _bump_seed) = Pubkey::find_program_address(&[initializer.key.as_ref(), account_data.title.as_bytes().as_ref()], program_id);
    if pda != *pda_account.key {
        msg!("invalid seeds for PDA");
        return Err(ReviewError::InvalidPDA.into());
    }

    // 28. data validation 
    if !account_data.is_initialized() {
        msg!("account is not initialized");
        return Err(ReviewError::UninitializedAccount.into());
    }

    // 29. check rating between 1-5
    if rating < 1 || rating > 5 {
        msg!("rating must be between 1 and 5");
        return Err(ReviewError::InvalidRating.into());
    }

    // 30. check length -- using already established title, but new description
    let total_len: usize = 1 + 1 + (4 + account_data.title.len()) + (4 + description.len());
    if total_len > 1000 {
        msg!("Data lenght is greater than 1000 bytes.");
        return Err(ReviewError::InvalidDataLength.into());
    }

    // 31. finally serialize data after all the checks 
    account_data.rating = rating;
    account_data.description = description;

    account_data.serialize(&mut &mut pda_account.data.borrow_mut()[..])?;
    
    Ok(())
}

// 32. build
// 33. deploy
// 34. grab program id, paste into front-end files

// 35. walk through error of 32006 or whatever 

